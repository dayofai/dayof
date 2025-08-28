import { describe, it, expect } from "vitest";

describe("Validation Smoke Tests", () => {
  it("should validate PassPathParamsSchema", async () => {
    const { PassPathParamsSchema } = await import("../../src/schemas/passParamsSchema");
    const { TEST_PASS_TYPE, TEST_SERIAL, TEST_DEVICE_ID } = await import("../fixtures/test-data");

    // Valid data should pass
    const validData = {
      deviceLibraryIdentifier: TEST_DEVICE_ID,
      passTypeIdentifier: TEST_PASS_TYPE,
      serialNumber: TEST_SERIAL,
    };
    
    const result = PassPathParamsSchema.safeParse(validData);
    expect(result.success).toBe(true);

    // Invalid pass type identifier should fail
    const invalidData = {
      deviceLibraryIdentifier: TEST_DEVICE_ID,
      passTypeIdentifier: "invalid-format",
      serialNumber: TEST_SERIAL,
    };
    
    const invalidResult = PassPathParamsSchema.safeParse(invalidData);
    expect(invalidResult.success).toBe(false);
  });

  it("should validate RegisterDeviceBodySchema", async () => {
    const { RegisterDeviceBodySchema } = await import("../../src/schemas/registerDeviceSchema");
    const { TEST_PUSH_TOKEN } = await import("../fixtures/test-data");

    // Valid data should pass
    const validData = { pushToken: TEST_PUSH_TOKEN };
    const result = RegisterDeviceBodySchema.safeParse(validData);
    expect(result.success).toBe(true);

    // Missing pushToken should fail
    const invalidData = {};
    const invalidResult = RegisterDeviceBodySchema.safeParse(invalidData);
    expect(invalidResult.success).toBe(false);
  });

  it("should validate PassIdParamsSchema", async () => {
    const { PassIdParamsSchema } = await import("../../src/schemas/passParamsSchema");
    const { TEST_PASS_TYPE, TEST_SERIAL } = await import("../fixtures/test-data");

    // Valid data should pass
    const validData = {
      passTypeIdentifier: TEST_PASS_TYPE,
      serialNumber: TEST_SERIAL,
    };
    
    const result = PassIdParamsSchema.safeParse(validData);
    expect(result.success).toBe(true);

    // Empty serial number should fail
    const invalidData = {
      passTypeIdentifier: TEST_PASS_TYPE,
      serialNumber: "",
    };
    
    const invalidResult = PassIdParamsSchema.safeParse(invalidData);
    expect(invalidResult.success).toBe(false);
  });

  it("should validate LogMessagesBodySchema", async () => {
    const { LogMessagesBodySchema } = await import("../../src/schemas/logMessagesSchema");

    // Valid data should pass
    const validData = {
      logs: [
        "Test log message 1",
        "Test log message 2"
      ]
    };
    
    const result = LogMessagesBodySchema.safeParse(validData);
    expect(result.success).toBe(true);

    // Empty logs array should fail (schema requires min 1 item)
    const emptyData = { logs: [] };
    const emptyResult = LogMessagesBodySchema.safeParse(emptyData);
    expect(emptyResult.success).toBe(false);

    // Missing logs property should fail
    const invalidData = {};
    const invalidResult = LogMessagesBodySchema.safeParse(invalidData);
    expect(invalidResult.success).toBe(false);
  });
}); 