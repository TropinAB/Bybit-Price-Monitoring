export const playBellSound = () => {
  try {
    const audioContext = new (window.AudioContext ||
      (window as any).webkitAudioContext)();

    // Создаем несколько осцилляторов для эффекта колокольчика
    const now = audioContext.currentTime;

    // Основной тон
    const osc1 = audioContext.createOscillator();
    const gain1 = audioContext.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(880, now); // Ля

    // Обертон для более богатого звука
    const osc2 = audioContext.createOscillator();
    const gain2 = audioContext.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(1320, now); // Ми (квинта)

    // Третий обертон
    const osc3 = audioContext.createOscillator();
    const gain3 = audioContext.createGain();
    osc3.type = "sine";
    osc3.frequency.setValueAtTime(1760, now); // Ля (октава)

    // Соединяем
    osc1.connect(gain1);
    osc2.connect(gain2);
    osc3.connect(gain3);

    gain1.connect(audioContext.destination);
    gain2.connect(audioContext.destination);
    gain3.connect(audioContext.destination);

    // Настройка громкости (затухание как у колокольчика)
    gain1.gain.setValueAtTime(0.1, now);
    gain1.gain.exponentialRampToValueAtTime(0.01, now + 1.5);

    gain2.gain.setValueAtTime(0.07, now);
    gain2.gain.exponentialRampToValueAtTime(0.007, now + 1.2);

    gain3.gain.setValueAtTime(0.05, now);
    gain3.gain.exponentialRampToValueAtTime(0.005, now + 1.0);

    // Запускаем и останавливаем
    osc1.start(now);
    osc2.start(now + 0.05); // Небольшая задержка для эффекта
    osc3.start(now + 0.1);

    osc1.stop(now + 2);
    osc2.stop(now + 1.8);
    osc3.stop(now + 1.6);
  } catch (error) {
    console.log("Звуковое оповещение не поддерживается");
  }
};
