/** Allow JSON.stringify / NextResponse.json on Prisma BigInt fields. */
export function register() {
  if (typeof BigInt !== "undefined") {
    Object.defineProperty(BigInt.prototype, "toJSON", {
      value: function (this: bigint) {
        return this.toString();
      },
      configurable: true,
      writable: true,
    });
  }
}
