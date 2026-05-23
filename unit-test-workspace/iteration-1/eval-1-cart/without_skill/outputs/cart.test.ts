import {
  CartItem,
  Coupon,
  calculateTotal,
  applyCoupon,
  getCartSummary,
} from "../cart";

describe("calculateTotal", () => {
  it("should return 0 for an empty cart", () => {
    expect(calculateTotal([])).toBe(0);
  });

  it("should calculate total for a single item with quantity 1", () => {
    const items: CartItem[] = [
      { id: "1", name: "Widget", price: 10, quantity: 1 },
    ];
    expect(calculateTotal(items)).toBe(10);
  });

  it("should multiply price by quantity for a single item", () => {
    const items: CartItem[] = [
      { id: "1", name: "Widget", price: 5, quantity: 3 },
    ];
    expect(calculateTotal(items)).toBe(15);
  });

  it("should sum totals across multiple items", () => {
    const items: CartItem[] = [
      { id: "1", name: "Widget", price: 10, quantity: 2 },
      { id: "2", name: "Gadget", price: 25, quantity: 1 },
      { id: "3", name: "Doohickey", price: 3, quantity: 4 },
    ];
    // 10*2 + 25*1 + 3*4 = 20 + 25 + 12 = 57
    expect(calculateTotal(items)).toBe(57);
  });

  it("should handle items with price 0", () => {
    const items: CartItem[] = [
      { id: "1", name: "Freebie", price: 0, quantity: 5 },
    ];
    expect(calculateTotal(items)).toBe(0);
  });

  it("should handle items with quantity 0", () => {
    const items: CartItem[] = [
      { id: "1", name: "Widget", price: 10, quantity: 0 },
    ];
    expect(calculateTotal(items)).toBe(0);
  });

  it("should handle decimal prices correctly", () => {
    const items: CartItem[] = [
      { id: "1", name: "Widget", price: 9.99, quantity: 2 },
    ];
    expect(calculateTotal(items)).toBeCloseTo(19.98);
  });
});

describe("applyCoupon", () => {
  describe("percentage coupons", () => {
    it("should apply a percentage discount", () => {
      const coupon: Coupon = { code: "SAVE10", type: "percentage", value: 10 };
      expect(applyCoupon(100, coupon)).toBe(90);
    });

    it("should apply a 50% discount", () => {
      const coupon: Coupon = { code: "HALF", type: "percentage", value: 50 };
      expect(applyCoupon(80, coupon)).toBe(40);
    });

    it("should apply a 100% discount resulting in 0", () => {
      const coupon: Coupon = { code: "FREE", type: "percentage", value: 100 };
      expect(applyCoupon(50, coupon)).toBe(0);
    });

    it("should round the result to 2 decimal places", () => {
      const coupon: Coupon = { code: "SAVE15", type: "percentage", value: 15 };
      // 33.33 - 15% = 33.33 * 0.85 = 28.3305 -> rounded to 28.33
      expect(applyCoupon(33.33, coupon)).toBe(28.33);
    });

    it("should handle 0% discount", () => {
      const coupon: Coupon = { code: "ZERO", type: "percentage", value: 0 };
      expect(applyCoupon(100, coupon)).toBe(100);
    });
  });

  describe("fixed coupons", () => {
    it("should subtract a fixed amount", () => {
      const coupon: Coupon = { code: "FLAT10", type: "fixed", value: 10 };
      expect(applyCoupon(100, coupon)).toBe(90);
    });

    it("should not go below 0", () => {
      const coupon: Coupon = { code: "BIG", type: "fixed", value: 200 };
      expect(applyCoupon(100, coupon)).toBe(0);
    });

    it("should return 0 when discount equals total", () => {
      const coupon: Coupon = { code: "EXACT", type: "fixed", value: 50 };
      expect(applyCoupon(50, coupon)).toBe(0);
    });

    it("should handle a fixed discount of 0", () => {
      const coupon: Coupon = { code: "ZERO", type: "fixed", value: 0 };
      expect(applyCoupon(100, coupon)).toBe(100);
    });
  });

  describe("minimum order amount", () => {
    it("should throw when total is below minOrderAmount", () => {
      const coupon: Coupon = {
        code: "MIN50",
        type: "percentage",
        value: 10,
        minOrderAmount: 50,
      };
      expect(() => applyCoupon(30, coupon)).toThrow(
        "Minimum order amount is 50"
      );
    });

    it("should apply coupon when total equals minOrderAmount", () => {
      const coupon: Coupon = {
        code: "MIN50",
        type: "percentage",
        value: 10,
        minOrderAmount: 50,
      };
      expect(applyCoupon(50, coupon)).toBe(45);
    });

    it("should apply coupon when total exceeds minOrderAmount", () => {
      const coupon: Coupon = {
        code: "MIN50",
        type: "fixed",
        value: 15,
        minOrderAmount: 50,
      };
      expect(applyCoupon(100, coupon)).toBe(85);
    });

    it("should apply coupon when minOrderAmount is not set", () => {
      const coupon: Coupon = { code: "SAVE5", type: "fixed", value: 5 };
      expect(applyCoupon(10, coupon)).toBe(5);
    });
  });
});

describe("getCartSummary", () => {
  const sampleItems: CartItem[] = [
    { id: "1", name: "Widget", price: 20, quantity: 2 },
    { id: "2", name: "Gadget", price: 15, quantity: 1 },
  ];

  it("should return correct summary without coupon", () => {
    const summary = getCartSummary(sampleItems);
    expect(summary).toEqual({
      subtotal: 55,
      total: 55,
      discount: 0,
      itemCount: 3,
    });
  });

  it("should return correct summary with a percentage coupon", () => {
    const coupon: Coupon = { code: "SAVE20", type: "percentage", value: 20 };
    const summary = getCartSummary(sampleItems, coupon);
    expect(summary).toEqual({
      subtotal: 55,
      total: 44,
      discount: 11,
      itemCount: 3,
    });
  });

  it("should return correct summary with a fixed coupon", () => {
    const coupon: Coupon = { code: "FLAT10", type: "fixed", value: 10 };
    const summary = getCartSummary(sampleItems, coupon);
    expect(summary).toEqual({
      subtotal: 55,
      total: 45,
      discount: 10,
      itemCount: 3,
    });
  });

  it("should return correct summary for an empty cart", () => {
    const summary = getCartSummary([]);
    expect(summary).toEqual({
      subtotal: 0,
      total: 0,
      discount: 0,
      itemCount: 0,
    });
  });

  it("should count total item quantities, not unique items", () => {
    const items: CartItem[] = [
      { id: "1", name: "A", price: 10, quantity: 3 },
      { id: "2", name: "B", price: 5, quantity: 7 },
    ];
    const summary = getCartSummary(items);
    expect(summary.itemCount).toBe(10);
  });

  it("should throw when coupon minOrderAmount is not met", () => {
    const items: CartItem[] = [
      { id: "1", name: "Cheap", price: 5, quantity: 1 },
    ];
    const coupon: Coupon = {
      code: "BIG",
      type: "percentage",
      value: 10,
      minOrderAmount: 50,
    };
    expect(() => getCartSummary(items, coupon)).toThrow(
      "Minimum order amount is 50"
    );
  });

  it("should cap discount so total does not go below 0 with fixed coupon", () => {
    const items: CartItem[] = [
      { id: "1", name: "Small", price: 5, quantity: 1 },
    ];
    const coupon: Coupon = { code: "HUGE", type: "fixed", value: 100 };
    const summary = getCartSummary(items, coupon);
    expect(summary.total).toBe(0);
    expect(summary.discount).toBe(5);
    expect(summary.subtotal).toBe(5);
  });
});
