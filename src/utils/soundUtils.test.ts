// soundUtils.test.ts - упрощенная версия
import { playBellSound } from "./soundUtils";

describe("soundUtils", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Мокаем AudioContext чтобы избежать реального звука
    window.AudioContext = jest.fn().mockImplementation(() => ({
      createOscillator: jest.fn().mockReturnValue({
        connect: jest.fn(),
        start: jest.fn(),
        stop: jest.fn(),
        frequency: { setValueAtTime: jest.fn() },
      }),
      createGain: jest.fn().mockReturnValue({
        connect: jest.fn(),
        gain: {
          setValueAtTime: jest.fn(),
          exponentialRampToValueAtTime: jest.fn(),
        },
      }),
      destination: {},
      currentTime: 0,
    }));
  });

  it("должен вызываться без ошибок", () => {
    expect(() => playBellSound()).not.toThrow();
  });

  it("должен логировать ошибку если API не поддерживается", () => {
    window.AudioContext = undefined as any;
    const consoleSpy = jest.spyOn(console, "log").mockImplementation();

    playBellSound();

    expect(consoleSpy).toHaveBeenCalledWith(
      "Звуковое оповещение не поддерживается",
    );
  });
});
