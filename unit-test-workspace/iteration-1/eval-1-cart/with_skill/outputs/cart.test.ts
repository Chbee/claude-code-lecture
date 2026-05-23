import { calculateTotal, applyCoupon, getCartSummary, CartItem, Coupon } from "../cart";

describe("calculateTotal", () => {
  it("returns sum of price * quantity for all items", () => {
    const items: CartItem[] = [
      { id: "1", name: "Shirt", price: 20, quantity: 2 },
      { id: "2", name: "Pants", price: 40, quantity: 1 },
    ];

    expect(calculateTotal(items)).toBe(80);
  });

  it("returns 0 for empty cart", () => {
    expect(calculateTotal([])).toBe(0);
  });
});

describe("applyCoupon", () => {
  it("applies percentage discount", () => {
    const coupon: Coupon = { code: "SAVE10", type: "percentage", value: 10 };

    expect(applyCoupon(100, coupon)).toBe(90);
  });

  it("applies fixed discount", () => {
    const coupon: Coupon = { code: "FLAT20", type: "fixed", value: 20 };

    expect(applyCoupon(100, coupon)).toBe(80);
  });

  it("throws when total is below minOrderAmount", () => {
    const coupon: Coupon = {
      code: "MIN50",
      type: "fixed",
      value: 10,
      minOrderAmount: 50,
    };

    expect(() => applyCoupon(30, coupon)).toThrow(
      "Minimum order amount is 50"
    );
  });

  it("clamps result to 0 when fixed discount exceeds total", () => {
    const coupon: Coupon = { code: "BIG", type: "fixed", value: 200 };

    expect(applyCoupon(50, coupon)).toBe(0);
  });

  it("rounds percentage discount to 2 decimal places", () => {
    const coupon: Coupon = { code: "SAVE33", type: "percentage", value: 33 };

    expect(applyCoupon(99.99, coupon)).toBe(66.99);
  });
});

describe("getCartSummary", () => {
  const items: CartItem[] = [
    { id: "1", name: "Book", price: 15, quantity: 3 },
    { id: "2", name: "Pen", price: 2, quantity: 5 },
  ];

  it("returns correct summary without coupon", () => {
    const summary = getCartSummary(items);

    expect(summary).toEqual({
      subtotal: 55,
      total: 55,
      discount: 0,
      itemCount: 8,
    });
  });

  it("returns correct summary with percentage coupon", () => {
    const coupon: Coupon = { code: "SAVE20", type: "percentage", value: 20 };
    const summary = getCartSummary(items, coupon);

    expect(summary).toEqual({
      subtotal: 55,
      total: 44,
      discount: 11,
      itemCount: 8,
    });
  });

  it("returns correct summary with fixed coupon", () => {
    const coupon: Coupon = { code: "FLAT10", type: "fixed", value: 10 };
    const summary = getCartSummary(items, coupon);

    expect(summary).toEqual({
      subtotal: 55,
      total: 45,
      discount: 10,
      itemCount: 8,
    });
  });
});
