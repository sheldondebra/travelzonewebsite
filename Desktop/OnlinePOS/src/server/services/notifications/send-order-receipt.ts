import {
  buildEmailReceiptBody,
  buildReceiptModel,
  renderTemplate,
} from "@/lib/receipt/build-receipt";
import type { ReceiptDeliveryResult } from "@/lib/receipt/types";
import { SMS_TEMPLATE_KEYS } from "@/lib/sms/automation-keys";
import { getReceiptData } from "@/server/services/order/get-receipt";
import {
  mergeMailConfig,
  sendBusinessEmail,
} from "@/server/services/notifications/email-provider";
import { logNotification } from "@/server/services/notifications/log-notification";
import { resolveNotificationSettings } from "@/server/services/notifications/resolve-config";
import { mergeSmsConfig } from "@/server/services/notifications/sms-provider";
import { sendTransactionalSms } from "@/server/services/sms/sms-service";

export async function sendOrderReceiptNotifications(
  businessId: string,
  orderId: string,
  options?: { forceSms?: boolean; forceEmail?: boolean },
): Promise<ReceiptDeliveryResult> {
  const result: ReceiptDeliveryResult = {
    sms: { attempted: false, sent: false },
    email: { attempted: false, sent: false },
  };

  const [resolved, order] = await Promise.all([
    resolveNotificationSettings(businessId),
    getReceiptData(businessId, orderId),
  ]);

  const { settings, platformSms, platformMail } = resolved;
  const business = order.business;

  const receipt = buildReceiptModel(order, settings.posReceipt);
  const smsConfig = mergeSmsConfig(settings.sms, platformSms);
  const mailConfig = mergeMailConfig(settings.mail, platformMail);

  const shouldSms =
    (options?.forceSms ?? settings.posReceipt.sendSmsOnSale) && smsConfig.enabled;
  const shouldEmail =
    (options?.forceEmail ?? settings.posReceipt.sendEmailOnSale) &&
    mailConfig.enabled;

  if (shouldSms && order.customer.phone) {
    result.sms.attempted = true;
    try {
      const receiptLink = `${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/dashboard/orders/${orderId}/receipt`;

      const smsResult = await sendTransactionalSms({
        businessId,
        recipient: order.customer.phone,
        templateKey: SMS_TEMPLATE_KEYS.RECEIPT_SMS,
        variables: {
          businessName: business.name,
          customerName: order.customer.name,
          receiptNumber: receipt.orderRef,
          orderNumber: receipt.orderRef,
          amount: receipt.totals.total.toFixed(2),
          receiptLink,
        },
        category: "RECEIPT",
        automationKey: "receipt_sms",
        relatedType: "ORDER",
        relatedId: orderId,
        skipAutomationCheck: options?.forceSms === true,
      });

      if (smsResult.sent) {
        result.sms.sent = true;
      } else if (smsResult.skipped) {
        result.sms.error = smsResult.reason ?? "SMS skipped";
        await logNotification({
          businessId,
          channel: "sms",
          recipient: order.customer.phone,
          status: "skipped",
          message: result.sms.error,
          source: "pos_receipt",
          orderId,
        });
      } else {
        result.sms.error = smsResult.reason ?? "SMS failed";
        await logNotification({
          businessId,
          channel: "sms",
          recipient: order.customer.phone,
          status: "failed",
          message: result.sms.error,
          source: "pos_receipt",
          orderId,
        });
      }
    } catch (e) {
      result.sms.error = e instanceof Error ? e.message : "SMS failed";
      await logNotification({
        businessId,
        channel: "sms",
        recipient: order.customer.phone,
        status: "failed",
        message: result.sms.error,
        source: "pos_receipt",
        orderId,
      });
    }
  } else if (shouldSms && !order.customer.phone) {
    result.sms.attempted = true;
    result.sms.error = "Customer has no phone number";
    await logNotification({
      businessId,
      channel: "sms",
      recipient: "—",
      status: "skipped",
      message: result.sms.error,
      source: "pos_receipt",
      orderId,
    });
  }

  if (shouldEmail && order.customer.email) {
    result.email.attempted = true;
    try {
      const subject = renderTemplate(
        settings.emailTemplates.orderReceiptSubject ||
          "Receipt from {{businessName}} — {{orderRef}}",
        {
          businessName: business.name,
          name: order.customer.name,
          orderId: order.id,
          orderRef: receipt.orderRef,
          date: receipt.createdAt.toLocaleString(),
          total: receipt.totals.total.toFixed(2),
          paymentStatus: order.paymentStatus,
          itemsSummary: "",
          thankYou: "",
        },
      );
      const text = buildEmailReceiptBody(
        receipt,
        settings.emailTemplates.orderReceipt,
      );
      await sendBusinessEmail(
        mailConfig,
        order.customer.email,
        subject,
        text,
      );
      result.email.sent = true;
      await logNotification({
        businessId,
        channel: "email",
        recipient: order.customer.email,
        subject,
        status: "sent",
        message: "POS receipt delivered",
        source: "pos_receipt",
        orderId,
      });
    } catch (e) {
      result.email.error = e instanceof Error ? e.message : "Email failed";
      await logNotification({
        businessId,
        channel: "email",
        recipient: order.customer.email,
        subject: "Receipt",
        status: "failed",
        message: result.email.error,
        source: "pos_receipt",
        orderId,
      });
    }
  } else if (shouldEmail && !order.customer.email) {
    result.email.attempted = true;
    result.email.error = "Customer has no email address";
    await logNotification({
      businessId,
      channel: "email",
      recipient: "—",
      status: "skipped",
      message: result.email.error,
      source: "pos_receipt",
      orderId,
    });
  }

  return result;
}
