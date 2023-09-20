# Process of making the vis White-hat

### Overview
There are several problems with the provided visualization in _Blackhat.js_ that make it a technically inferior visualization and misrepresents the data being displayed. Incorrect color encoding, disproportionate bubbles sizes on the map, irrelevant metric used for the x-axis in the scatterplot, and the incompleteness of data represented on the map are some of the major issues that pop out.

In order to rectify these problems, I followed some conventions discussed in class, and referred to some literature, to come up with a better visual experience for the user. Additionally, I provided functionality that allows users to explore the data and derive conclusions based on their judgement. The end goal of these changes was to adequately represent the gun violence data and give the user an idea about gun threat to either gender across the country.

### Steps

- Modified the color scheme of the map- using a sequential and colorblind safe color scale. I used a red colored theme to intuitively map the "danger" of violence in each state.
- Modified the color scale on the map to show deaths per 1 Million residents in each state rather than the total number of deaths.
- Added a tooltip to show City data on mouse hover.
- Modified the code to use area to encode city gun deaths. I used the formula r = (1 + 1.5 * Math.sqrt(_count_)), where _count_ is the number of deaths in that city.
- Updated the x-axis of the bottom plot to show the state abbreviations. The y-axis indicates number of gun deaths.
- Split the data by gender and plotted it on a stacked bar chart.

### Resources

Color Brewer: [https://colorbrewer2.org/#type=sequential&scheme=Reds&n=9](https://colorbrewer2.org/#type=sequential&scheme=Reds&n=9)

Stacked Bar Chart: [https://observablehq.com/@stuartathompson/a-step-by-step-guide-to-the-d3-v4-stacked-bar-chart](https://observablehq.com/@stuartathompson/a-step-by-step-guide-to-the-d3-v4-stacked-bar-chart)

Visual Analysis & Design, Tamara Munzner: [https://i-share-uic.primo.exlibrisgroup.com/discovery/fulldisplay?docid=alma99494790991905897&context=L&vid=01CARLI_UIC:CARLI_UIC&lang=en&search_scope=NewDiscoveryNetwork&adaptor=Local%20Search%20Engine&tab=NewDiscoveryNetwork&query=any,contains,data%20visualization%20munzner&sortby=date_d&facet=frbrgroupid,include,9061679065239940751&offset=0](https://i-share-uic.primo.exlibrisgroup.com/discovery/fulldisplay?docid=alma99494790991905897&context=L&vid=01CARLI_UIC:CARLI_UIC&lang=en&search_scope=NewDiscoveryNetwork&adaptor=Local%20Search%20Engine&tab=NewDiscoveryNetwork&query=any,contains,data%20visualization%20munzner&sortby=date_d&facet=frbrgroupid,include,9061679065239940751&offset=0)