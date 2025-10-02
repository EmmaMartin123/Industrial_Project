package frontend

type PitchMedia struct {
	ID                 *int64 `json:"id,omitempty"`
	PitchID            *int64 `json:"pitch_id,omitempty"`
	URL                string `json:"url"`
	MediaType          string `json:"media_type"`
	OrderInDescription int64  `json:"order_in_description"`
}
