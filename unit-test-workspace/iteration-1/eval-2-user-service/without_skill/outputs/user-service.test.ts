import { describe, it, expect, vi, beforeEach } from "vitest";
import { UserService, UserRepository, User } from "../../../../../.claude/skills/unit-test/evals/files/user-service";

function createMockRepo(): {
  [K in keyof UserRepository]: ReturnType<typeof vi.fn>;
} {
  return {
    findById: vi.fn(),
    findByEmail: vi.fn(),
    save: vi.fn(),
    delete: vi.fn(),
  };
}

function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: "user-1",
    email: "alice@example.com",
    name: "Alice",
    role: "user",
    createdAt: new Date("2025-01-01"),
    ...overrides,
  };
}

describe("UserService", () => {
  let repo: ReturnType<typeof createMockRepo>;
  let service: UserService;

  beforeEach(() => {
    repo = createMockRepo();
    service = new UserService(repo);
  });

  // ---------- getUserById ----------

  describe("getUserById", () => {
    it("should return the user when found", async () => {
      const user = makeUser();
      repo.findById.mockResolvedValue(user);

      const result = await service.getUserById("user-1");

      expect(result).toEqual(user);
      expect(repo.findById).toHaveBeenCalledWith("user-1");
    });

    it("should throw when user is not found", async () => {
      repo.findById.mockResolvedValue(null);

      await expect(service.getUserById("unknown")).rejects.toThrow(
        "User not found: unknown"
      );
    });
  });

  // ---------- updateEmail ----------

  describe("updateEmail", () => {
    it("should update the email successfully", async () => {
      const user = makeUser();
      const updated = { ...user, email: "newalice@example.com" };

      repo.findByEmail.mockResolvedValue(null);
      repo.findById.mockResolvedValue(user);
      repo.save.mockResolvedValue(updated);

      const result = await service.updateEmail("user-1", "newalice@example.com");

      expect(result).toEqual(updated);
      expect(repo.save).toHaveBeenCalledWith(
        expect.objectContaining({ email: "newalice@example.com" })
      );
    });

    it("should throw if the new email has no @ symbol", async () => {
      await expect(
        service.updateEmail("user-1", "invalid-email")
      ).rejects.toThrow("Invalid email format");

      expect(repo.findByEmail).not.toHaveBeenCalled();
      expect(repo.findById).not.toHaveBeenCalled();
    });

    it("should throw if the email is already used by another user", async () => {
      const otherUser = makeUser({ id: "user-2", email: "taken@example.com" });
      repo.findByEmail.mockResolvedValue(otherUser);

      await expect(
        service.updateEmail("user-1", "taken@example.com")
      ).rejects.toThrow("Email already in use");

      expect(repo.save).not.toHaveBeenCalled();
    });

    it("should allow updating to the same email the user already owns", async () => {
      const user = makeUser({ email: "same@example.com" });

      repo.findByEmail.mockResolvedValue(user); // same id
      repo.findById.mockResolvedValue(user);
      repo.save.mockResolvedValue(user);

      const result = await service.updateEmail("user-1", "same@example.com");

      expect(result).toEqual(user);
      expect(repo.save).toHaveBeenCalled();
    });

    it("should throw if the user to update does not exist", async () => {
      repo.findByEmail.mockResolvedValue(null);
      repo.findById.mockResolvedValue(null);

      await expect(
        service.updateEmail("missing", "new@example.com")
      ).rejects.toThrow("User not found: missing");
    });
  });

  // ---------- deleteUser ----------

  describe("deleteUser", () => {
    it("should delete the user when requester is admin", async () => {
      const admin = makeUser({ id: "admin-1", role: "admin" });
      repo.findById.mockResolvedValue(admin);
      repo.delete.mockResolvedValue(undefined);

      await service.deleteUser("user-1", "admin-1");

      expect(repo.delete).toHaveBeenCalledWith("user-1");
    });

    it("should throw if requester is not admin (role: user)", async () => {
      const regularUser = makeUser({ id: "user-1", role: "user" });
      repo.findById.mockResolvedValue(regularUser);

      await expect(
        service.deleteUser("user-2", "user-1")
      ).rejects.toThrow("Only admins can delete users");

      expect(repo.delete).not.toHaveBeenCalled();
    });

    it("should throw if requester is not admin (role: guest)", async () => {
      const guest = makeUser({ id: "guest-1", role: "guest" });
      repo.findById.mockResolvedValue(guest);

      await expect(
        service.deleteUser("user-1", "guest-1")
      ).rejects.toThrow("Only admins can delete users");

      expect(repo.delete).not.toHaveBeenCalled();
    });

    it("should throw if admin tries to delete themselves", async () => {
      const admin = makeUser({ id: "admin-1", role: "admin" });
      repo.findById.mockResolvedValue(admin);

      await expect(
        service.deleteUser("admin-1", "admin-1")
      ).rejects.toThrow("Cannot delete yourself");

      expect(repo.delete).not.toHaveBeenCalled();
    });

    it("should throw if the requester does not exist", async () => {
      repo.findById.mockResolvedValue(null);

      await expect(
        service.deleteUser("user-1", "ghost")
      ).rejects.toThrow("User not found: ghost");

      expect(repo.delete).not.toHaveBeenCalled();
    });
  });
});
