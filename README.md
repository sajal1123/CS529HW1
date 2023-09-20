# Process of making the vis White-hat

### Overview
There are several problems with the provided visualization in _Blackhat.js_ that make it a technically inferior visualization and misrepresents the data being displayed. Incorrect color encoding, disproportionate bubbles sizes on the map, irrelevant metric used for the x-axis in the scatterplot, and the incompleteness of data represented on the map are some of the major issues that pop out.

In order to rectify these problems, I followed some conventions discussed in class, and referred to some literature, to come up with a better visual experience for the user. Additionally, I provided functionality that allows users to explore the data and derive conclusions based on their judgement. The end goal of these changes was to adequately represent the gun violence data and give the user an idea about gun threat to either gender across the country.

### Steps

- Modified the color scheme of the map- using a sequential and colorblind safe color scale. I used a red colored theme to intuitively map the "danger" of violence in each state.
- Added a tooltip to show City data on mouse over.
- Modified the code to use area to encode city gun deaths. I used the formula r = (1 + 1.5 * Math.sqrt(_count_)), where _count_ is the number of deaths in that city.
- Updated the x-axis of the bottom plot to show the population of each state. The y-axis is left unchanged.
- Split the data by gender and plotted it with separate color encoding. Further, I added a line for each gender to indicate the nation-wide average gun deaths per 100,000 male/female residents to give the user additional context.
- Modified the color scale on the map to show deaths per 1 Million residents in each state rather than the total number of deaths.

### Resources
