class LoggingLevel {
    static NONE = 0;
    static ERROR = 1;
    static WARN = 2;
    static INFO = 3;
}

class Logger {
    static disabled = false;

    constructor(tag, level=LoggingLevel.INFO) {
        this.tag = tag;
        this.level = level;
    }

    info(...objs) {
        if (!Logger.disabled && this.level < LoggingLevel.INFO) return;
        console.log(this.tag, ...objs);
    }

    warn(...objs) {
        if (!Logger.disabled && this.level < LoggingLevel.WARN) return;
        console.warn(this.tag, ...objs);
    }

    error(...objs) {
        if (!Logger.disabled && this.level < LoggingLevel.ERROR) return;
        console.error(this.tag, ...objs);
    }
}

class Timer {
    #startTime = null;
    #lastLap = null;
    #endTime = null;
    #highResolution;

    constructor(highResolution=false) {
        this.#highResolution = highResolution;
        this.restart();
    }

    #getTime(time) {
        if (this.#highResolution) {
            return time;
        }
        return Math.round(time);
    }

    restart() {
        const now = performance.now();
        this.#startTime = now;
        this.#lastLap = now;
        this.#endTime = null;
    }

    lap() {
        const now = performance.now();

        if (this.#startTime === null) {
            console.error('Use `start()` to start the timer first.');
            return;
        }

        const lapTime = now - this.#lastLap;
        this.#lastLap = now;
        return this.#getTime(lapTime);
    }

    totalTime() {
        const endTime = this.#endTime ? this.#endTime : performance.now();

        if (this.#startTime === null) {
            console.error('Use `start()` to start the timer first.');
            return;
        }

        return this.#getTime(endTime - this.#startTime);
    }

    stop() {
        const now = performance.now();

        if (this.#startTime === null) {
            console.error('Use `start()` to start the timer first.');
            return;
        }

        this.#endTime = now;
        return this.#getTime(this.#endTime - this.#startTime);
    }
}
