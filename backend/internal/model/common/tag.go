package model

type Tag struct {
	TagID *int64 `json:"id,omitempty"`
	Name  string `json:"name"`
}
