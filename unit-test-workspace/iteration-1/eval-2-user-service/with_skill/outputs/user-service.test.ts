import { describe, it, expect, beforeEach, vi } from "vitest";
import { UserService, UserRepository, User } from "../../../../../.claude/skills/unit-test/evals/files/user-service";

describe("UserService", () => {
  let repo: {
    findById: ReturnType<typeof vi.fn>;
    findByEmail: ReturnType<typeof vi.fn>;
    save: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };
  let service: UserService;

  const adminUser: User = {
    id: "admin-1",
    email: "admin@test.com",
    name: "Admin",
    role: "admin",
    createdAt: new Date("2024-01-01"),
  };

  const normalUser: User = {
    id: "user-1",
    email: "user@test.com",
    name: "User",
    role: "user",
    createdAt: new Date("2024-01-01"),
  };

  beforeEach(() => {
    repo = {
      findById: vi.fn(),
      findByEmail: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
    };
    service = new UserService(repo);
  });

  describe("getUserById", () => {
    it("유저가 존재하면 반환한다", async () => {
      repo.findById.mockResolvedValue(normalUser);

      const result = await service.getUserById("user-1");

      expect(result).toEqual(normalUser);
    });

    it("유저가 없으면 에러를 던진다", async () => {
      repo.findById.mockResolvedValue(null);

      await expect(service.getUserById("unknown")).rejects.toThrow(
        "User not found: unknown"
      );
    });
  });

  describe("updateEmail", () => {
    it("유효한 이메일로 업데이트한다", async () => {
      const updated = { ...normalUser, email: "new@test.com" };
      repo.findByEmail.mockResolvedValue(null);
      repo.findById.mockResolvedValue(normalUser);
      repo.save.mockResolvedValue(updated);

      const result = await service.updateEmail("user-1", "new@test.com");

      expect(result).toEqual(updated);
      expect(repo.save).toHaveBeenCalledWith(updated);
    });

    it("같은 유저가 자신의 이메일로 업데이트하면 허용한다", async () => {
      const updated = { ...normalUser, email: "user@test.com" };
      repo.findByEmail.mockResolvedValue(normalUser);
      repo.findById.mockResolvedValue(normalUser);
      repo.save.mockResolvedValue(updated);

      const result = await service.updateEmail("user-1", "user@test.com");

      expect(result).toEqual(updated);
    });

    it("@가 없는 이메일이면 에러를 던진다", async () => {
      await expect(
        service.updateEmail("user-1", "invalid-email")
      ).rejects.toThrow("Invalid email format");
    });

    it("다른 유저가 사용 중인 이메일이면 에러를 던진다", async () => {
      repo.findByEmail.mockResolvedValue({ ...adminUser, email: "taken@test.com" });

      await expect(
        service.updateEmail("user-1", "taken@test.com")
      ).rejects.toThrow("Email already in use");
    });

    it("유저가 존재하지 않으면 에러를 던진다", async () => {
      repo.findByEmail.mockResolvedValue(null);
      repo.findById.mockResolvedValue(null);

      await expect(
        service.updateEmail("unknown", "new@test.com")
      ).rejects.toThrow("User not found: unknown");
    });
  });

  describe("deleteUser", () => {
    it("admin이 다른 유저를 삭제한다", async () => {
      repo.findById.mockResolvedValue(adminUser);

      await service.deleteUser("user-1", "admin-1");

      expect(repo.delete).toHaveBeenCalledWith("user-1");
    });

    it("admin이 아니면 에러를 던진다", async () => {
      repo.findById.mockResolvedValue(normalUser);

      await expect(
        service.deleteUser("admin-1", "user-1")
      ).rejects.toThrow("Only admins can delete users");
    });

    it("자기 자신을 삭제하면 에러를 던진다", async () => {
      repo.findById.mockResolvedValue(adminUser);

      await expect(
        service.deleteUser("admin-1", "admin-1")
      ).rejects.toThrow("Cannot delete yourself");
    });
  });
});
