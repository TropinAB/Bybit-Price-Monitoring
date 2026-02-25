import "@testing-library/jest-dom";
import util from "util";

// Добавляем полифиллы для TextEncoder и TextDecoder
global.TextEncoder = util.TextEncoder;
global.TextDecoder = util.TextDecoder as any; // Используем 'as any', чтобы избежать ошибок типов, если они возникнут
