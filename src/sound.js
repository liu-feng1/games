class SoundManager {
    constructor() {
        this.sounds = {
            move: new Audio('/sounds/move.mp3'),
            rotate: new Audio('/sounds/rotate.mp3'),
            drop: new Audio('/sounds/drop.mp3'),
            clear: new Audio('/sounds/clear.mp3')
        };

        // 预加载所有音频
        Object.values(this.sounds).forEach(audio => {
            audio.load();
            // 设置音量
            audio.volume = 0.3;
        });
    }

    play(soundName) {
        const sound = this.sounds[soundName];
        if (sound) {
            // 重置音频播放位置并播放
            sound.currentTime = 0;
            // 使用 Promise 包装播放，处理可能的播放失败情况
            const playPromise = sound.play();
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.log('播放音效失败:', error);
                });
            }
        }
    }
}

export default SoundManager;