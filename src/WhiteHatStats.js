import React, {useEffect, useRef,useMemo} from 'react';
import useSVGCanvas from './useSVGCanvas.js';
import * as d3 from 'd3';

//change the code below to modify the bottom plot view
export default function WhiteHatStats(props){
    //this is a generic component for plotting a d3 plot
    const d3Container = useRef(null);
    //this automatically constructs an svg canvas the size of the parent container (height and width)
    //tTip automatically attaches a div of the class 'tooltip' if it doesn't already exist
    //this will automatically resize when the window changes so passing svg to a useeffect will re-trigger
    const [svg, height, width,  tTip] = useSVGCanvas(d3Container);

    const margin = 50;
    const radius = 1;


    //TODO: modify or replace the code below to draw a more truthful or insightful representation of the dataset. This other representation could be a histogram, a stacked bar chart, etc.
    //this loop updates when the props.data changes or the window resizes
    //we can edit it to also use props.brushedState if you want to use linking
    useEffect(()=>{
        //wait until the data loads
        if(svg === undefined | props.data === undefined){ return }

        //aggregate gun deaths by state
        const data = props.data.states;
        
        //get data for each state
        const plotData = [];
        console.log("state data = ", data);
        for(let state of data){
            const dd = drawingDifficulty[state.abreviation];
            let entry = {
                'count': state.count,
                'name': state.state,
                // 'easeOfDrawing': dd === undefined? 5: dd,
                'genderRatio': state.male_count/state.count,
                'population': parseInt(state.population),
                'male_deaths': state.male_count,
                'female_deaths': state.count - state.male_count
            }
            plotData.push(entry)
        }

        //get transforms for each value into x and y coordinates
        console.log("x domain = ", d3.extent(plotData,d=>d.population));
        console.log("x range = ", [width-margin-radius, margin+radius]);
        
        let xScale = d3.scaleLinear()
            .domain(d3.extent(plotData,d=>d.population))
            .range([margin+radius, width-margin-radius]);
        let yScale = d3.scaleLinear()
            .domain(d3.extent(plotData,d=>d.male_deaths))
            .range([height-margin-radius,margin+radius]);


        //draw a line showing the mean values across the curve
        //this probably isn't actually regression

        var nationalAverage = d3.sum(plotData, d=>(d.count))/d3.sum(plotData, d=>d.population)
        var maleAverage = d3.sum(plotData, d=>(d.male_deaths))/d3.sum(plotData, d=>d.population)
        var femaleAverage = d3.sum(plotData, d=>((d.count - d.male_deaths)))/d3.sum(plotData, d=>d.population)
        console.log("National Average = ", nationalAverage);
        
        //scale color by gender ratio for no reason
        let colorScale = d3.scaleDiverging()
            .domain([0,.5,1])
            .range(['magenta','white','navy']);

        //draw the circles for each state
        svg.selectAll('.dot').remove();
        let circles1 = svg.selectAll('.dot').data(plotData)
            .enter().append('circle')
            .attr('cy',d=> yScale(d.male_deaths))
            .attr('cx',d=>xScale(d.population))
            .attr('fill',d=> 'blue')
            .attr('r',5)
            .on('mouseover',(e,d)=>{
                let string = '<strong>' + d.name + '</strong>' + '</br>'
                    + 'Gun Deaths: ' + d.count + '</br>'
                    + 'Male Deaths: ' + d.male_deaths + '<br>'
                    + 'Male Deaths Per 100k: ' + (100000*d.male_deaths/d.population).toFixed(2);
                props.ToolTip.moveTTipEvent(tTip,e)
                tTip.html(string)
            }).on('mousemove',(e)=>{
                props.ToolTip.moveTTipEvent(tTip,e);
            }).on('mouseout',(e,d)=>{
                props.ToolTip.hideTTip(tTip);
            });

        svg.selectAll('.dot').remove();
        let circles2 = svg.selectAll('.dot').data(plotData)
            .enter().append('circle')
            .attr('cy',d=> yScale(d.female_deaths))
            .attr('cx',d=>xScale(d.population))
            .attr('fill',d=> 'pink')
            .attr('r',5)
            .on('mouseover',(e,d)=>{
                let string = '<strong>' + d.name + '</strong>' + '</br>'
                    + 'Gun Deaths: ' + d.count + '</br>'
                    + 'Female Deaths: ' + (d.count - d.male_deaths) + '<br>'
                    + 'Female Deaths Per 100k: ' + (100000*(d.count - d.male_deaths)/d.population).toFixed(2);
                
                props.ToolTip.moveTTipEvent(tTip,e)
                tTip.html(string)
            }).on('mousemove',(e)=>{
                props.ToolTip.moveTTipEvent(tTip,e);
            }).on('mouseout',(e,d)=>{
                // Remove lines and labels on mouseout
                props.ToolTip.hideTTip(tTip);
            });
            
        //draw the line
        let xValues = []
        for(let state of data){
            xValues.push(state.population);
        }

        let xValuesMale = []
        for(let state of data){
            xValues.push(state.male_count);
        }

        let xValuesFemale = []
        for(let state of data){
            xValues.push(state.count - state.male_count);
        }


        let popRange = d3.extent(plotData, d=>d.population)
        console.log("POP RANGE = ", popRange);
        let yValues = []
        // for(let i=parseInt(popRange[0]); i<parseInt(popRange[1]); i++){
        //     yValues.push(parseInt(nationalAverage*i))
        // }
        console.log("xValues = ", xValues);
        // Calculate corresponding y values
        console.log("yVals  = ", yValues);
        // Create a line generator
        let lineGenerator = d3.line()
            .x(d => xScale(d))
            .y(d => yScale(nationalAverage * d));

        // Append the path element to plot the line
        var linePath = svg.append('path')
            .datum(xValues)
            .attr('d', lineGenerator)
            .attr('fill', 'red')
            .attr('strike-width', .5)
            .attr('stroke', 'black');

        let lineGeneratorMale = d3.line()
        .x(d => xScale(d))
        .y(d => yScale(maleAverage * d));

    // Append the path element to plot the line
    var linePathMale = svg.append('path')
        .datum(xValues)
        .attr('d', lineGeneratorMale)
        .attr('fill', 'red')
        .attr('strike-width', .5)
        .attr('stroke', 'blue');

    let lineGeneratorFemale = d3.line()
    .x(d => xScale(d))
    .y(d => yScale(femaleAverage * d));

    // Append the path element to plot the line
    var linePathFemale = svg.append('path')
        .datum(xValues)
        .attr('d', lineGeneratorFemale)
        .attr('fill', 'red')
        .attr('strike-width', .5)
        .attr('stroke', 'red');
    

        //change the title
        const labelSize = margin/2;
        svg.selectAll('text').remove();
        svg.append('text')
            .attr('x',width/2)
            .attr('y',labelSize)
            .attr('text-anchor','middle')
            .attr('font-size',labelSize)
            .attr('font-weight','bold')
            .text('Gun Deaths v/s State Population');

        //change the disclaimer here
        svg.append('text')
            .attr('x',width-20)
            .attr('y',height/1.8)
            .attr('text-anchor','end')
            .attr('font-size',10)
            .attr('fill', 'black')
            .text("Total Deaths: "+ (100000*nationalAverage).toFixed(2)+" deaths/100,000\nresidents");

        //change the disclaimer here
        svg.append('text')
            .attr('x',width-20)
            .attr('y',height/1.7)
            .attr('text-anchor','end')
            .attr('font-size',10)
            .attr('fill', 'blue')
            .text("Male Deaths: "+ (100000*maleAverage).toFixed(2)+" deaths/100,000\nresidents");

                    //change the disclaimer here
        svg.append('text')
        .attr('x',width-20)
        .attr('y',height/1.61)
        .attr('text-anchor','end')
        .attr('font-size',10)
        .attr('fill', 'red')
        .text("Female Deaths: "+ (100000*femaleAverage).toFixed(2)+" deaths/100,000\nresidents");


        //draw basic axes using the x and y scales
        svg.selectAll('g').remove()
        // svg.append('g')
        //     .attr('transform',`translate(0,${height-margin+1})`)
        //     .call(d3.axisBottom(xScale))
        //     .selectAll('text')
        //     .attr('transform', 'rotate(-45)')
        //     .style('text-anchor', 'end')

            // svg.append('g')
            //     .attr('transform',`translate(${margin-2},0)`)
            //     .call(d3.axisLeft(yScale))

        
        let xAxis = d3.axisBottom(xScale);
        let yAxis = d3.axisLeft(yScale);

        // Append the axes to the SVG
        let xAxisGroup = svg.append('g')
            .attr('transform', `translate(0,${height-margin+1})`)
            .call(xAxis);

        let yAxisGroup = svg.append('g')
            .attr('transform',`translate(${margin-2},0)`)
            .call(yAxis);
        
        // Add labels to the axes
        xAxisGroup.selectAll('.x-axis-label').remove(); // Remove existing labels
        yAxisGroup.selectAll('.y-axis-label').remove(); // Remove existing labels

        svg.append('text')
            .attr('class', 'x-axis-label')
            .attr('transform', `translate(0,${height-margin+2})`)
            .attr('x', width/2)
            .attr('y', margin-10) // Adjust the position as needed
            .style('text-anchor', 'middle')
            .text('Population');

        svg.append('text')
            .attr('class', 'y-axis-label')
            // .attr('transform',`translate(${margin-3},0)`)
            // .attr('transform', 'rotate(90)')
            .attr('x', margin-25)
            .attr('y', margin/3) // Adjust the position as needed
            .style('text-anchor', 'middle')
            .text('Deaths');

        function zoomed(event) {
            // Update scales based on the zoom event
            let new_xScale = event.transform.rescaleX(xScale);
            let new_yScale = event.transform.rescaleY(yScale);
        
            // Update the axes
            xAxis.scale(new_xScale);
            yAxis.scale(new_yScale);
        
            // Redraw the axes
            xAxisGroup.call(xAxis);
            yAxisGroup.call(yAxis);

        
            // Apply the zoom transformation to the circles
            svg.selectAll('circle')
                .attr('transform', event.transform);
            
            // Calculate a scale factor based on the zoom level
            let scaleFactor = event.transform.k;

            // Update the circle radii based on the zoom level
            circles1.attr('r', 5 * (1/scaleFactor));
            circles2.attr('r', 5 * (1/scaleFactor));

            // Update the line path with the new scales
            lineGenerator.x(d => new_xScale(d)); // Update xScale
            lineGenerator.y(d => new_yScale(nationalAverage * d)); // Update yScale
        
            lineGeneratorMale.x(d => new_xScale(d)); // Update xScale
            lineGeneratorMale.y(d => new_yScale(maleAverage * d)); // Update yScale

            lineGeneratorFemale.x(d => new_xScale(d)); // Update xScale
            lineGeneratorFemale.y(d => new_yScale(femaleAverage * d)); // Update yScale



            linePath.attr('d', lineGenerator); // Redraw the line
            linePathMale.attr('d', lineGeneratorMale); // Redraw the line
            linePathFemale.attr('d', lineGeneratorFemale); // Redraw the line

        }
        
        let zoom = d3.zoom()
            .scaleExtent([1, 10])
            .on('zoom', zoomed);
        
        svg.call(zoom);            
    
        
    },[props.data,svg]);

    return (
        <div
            className={"d3-component"}
            style={{'height':'99%','width':'99%'}}
            ref={d3Container}
        ></div>
    );
}
//END of TODO #1.

 
const drawingDifficulty = {
    'IL': 9,
    'AL': 2,
    'AK': 1,
    'AR': 3,
    'CA': 9.51,
    'CO': 0,
    'DE': 3.1,
    'DC': 1.3,
    'FL': 8.9,
    'GA': 3.9,
    'HI': 4.5,
    'ID': 4,
    'IN': 4.3,
    'IA': 4.1,
    'KS': 1.6,
    'KY': 7,
    'LA': 6.5,
    'MN': 2.1,
    'MO': 5.5,
    'ME': 7.44,
    'MD': 10,
    'MA': 6.8,
    'MI': 9.7,
    'MN': 5.1,
    'MS': 3.8,
    'MT': 1.4,
    'NE': 1.9,
    'NV': .5,
    'NH': 3.7,
    'NJ': 9.1,
    'NM': .2,
    'NY': 8.7,
    'NC': 8.5,
    'ND': 2.3,
    'OH': 5.8,
    'OK': 6.05,
    'OR': 4.7,
    'PA': 4.01,
    'RI': 8.4,
    'SC': 7.1,
    'SD': .9,
    'TN': 3.333333,
    'TX': 8.1,
    'UT': 2.8,
    'VT': 2.6,
    'VA': 8.2,
    'WA': 9.2,
    'WV': 7.9,
    'WY': 0,
}
