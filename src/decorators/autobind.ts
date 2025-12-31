/**
 * autobind decorator
 */
export function autobind(_: any, _2: string, descriptor: PropertyDescriptor) {
  // Store a reference to the original method
  const originalMethod = descriptor.value;

  const adjustedDescriptor: PropertyDescriptor = {
    configurable: true,
    enumerable: false, // Method should not appear during object enumeration
    // Using a getter ensures the method is bound only when accessed
    get() {
      // 'this' refers to the concrete class instance accessing the method
      // Automatically bind the original method to the current instance
      const boundFn = originalMethod.bind(this);

      return boundFn;
    },
  };

  return adjustedDescriptor;
}
