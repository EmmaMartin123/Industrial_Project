package frontend

type PitchMedia struct {
	ID                 *int   `json:"id,omitempty"`
	PitchID            *int   `json:"pitch_id,omitempty"`
	URL                string `json:"url"`
	MediaType          string `json:"media_type"`
	OrderInDescription int    `json:"order_in_description"`
}
