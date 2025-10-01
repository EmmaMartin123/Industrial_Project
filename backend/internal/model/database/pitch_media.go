package database

type PitchMedia struct {
	ID                 *int   `json:"id,omitempty"`
	PitchID            int    `json:"pitch_id"`
	URL                string `json:"url"`
	MediaType          string `json:"media_type"`
	OrderInDescription int    `json:"order_in_description"`
	CreatedAt          string `json:"created_at,omitempty"`
}
