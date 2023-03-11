package log

import (
	"os"

	"github.com/go-kit/log"
	"github.com/go-kit/log/level"
)

type Logger log.Logger

func ConfigureLogger(l *Logger, lvl string) {
	*l = log.With(
		level.NewFilter(
			log.NewJSONLogger(os.Stderr),
			level.Allow(level.ParseDefault(lvl, level.InfoValue())),
		),
		"ts", log.DefaultTimestamp,
		"caller", log.Caller(5),
	)
}

func With(logger Logger, keyvals ...interface{}) log.Logger {
	return log.With(logger, keyvals...)
}

func Debug(l Logger, msg interface{}, kv ...interface{}) {
	logWithMessage(level.Debug(l), msg, kv...)
}

func Info(l Logger, msg interface{}, kv ...interface{}) {
	logWithMessage(level.Info(l), msg, kv...)
}

func Warn(l Logger, msg interface{}, kv ...interface{}) {
	logWithMessage(level.Warn(l), msg, kv...)
}

func Error(l Logger, msg interface{}, err error, kv ...interface{}) {
	logWithMessage(level.Error(log.With(l, "error", err)), msg, kv...)
}

func logWithMessage(l Logger, msg interface{}, kv ...interface{}) {
	log.With(l, "msg", msg).Log(kv...)
}
