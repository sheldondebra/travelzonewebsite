/** Prisma returns BigInt for legacy ids; patch JSON serialization once per process. */
if (typeof BigInt !== "undefined") {
  const proto = BigInt.prototype as bigint & { toJSON?: () => string };
  if (typeof proto.toJSON !== "function") {
    Object.defineProperty(BigInt.prototype, "toJSON", {
      value: function (this: bigint) {
        return this.toString();
      },
      configurable: true,
      writable: true,
    });
  }
}
