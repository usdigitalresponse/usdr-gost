//go:generate sh generate.sh
package grantData

import (
	"time"
)

func (v MMDDYYYYType) Time() (time.Time, error) {
	l := "01022006"
	return time.Parse(l, string(v))
}

type OpportunitySynopsisDetail_1_0 OpportunitySynopsisDetail10
type OpportunityForecastDetail_1_0 OpportunityForecastDetail10

// type Grant struct {
// 	OpportunitySynopsisDetail10 `xml:"Grants"`
// }
