package utils

import (
	"context"
)

type ctxKey string

const UserIDKey ctxKey = "uid"

func CtxWithUserID(ctx context.Context, uid string) context.Context {
	return context.WithValue(ctx, UserIDKey, uid)
}

func UserIDFromCtx(ctx context.Context) (string, bool) {
	uid, ok := ctx.Value(UserIDKey).(string)
	return uid, ok
}
