import React, {useRef,useMemo} from 'react';
import useSVGCanvas from './useSVGCanvas.js';
import * as d3 from 'd3';
import { logDOM } from '@testing-library/react';

export default function Whitehat(props){
    //this is a generic component for plotting a d3 plot
    const d3Container = useRef(null);
    //this automatically constructs an svg canvas the size of the parent container (height and width)
    //tTip automatically attaches a div of the class 'tooltip' if it doesn't already exist
    //this will automatically resize when the window changes so passing svg to a useeffect will re-trigger
    const [svg, height, width, tTip] = useSVGCanvas(d3Container);
    var isZoomed = false;

    //TODO: change the line below to change the size of the white-hat maximum bubble size
    const maxRadius = width/300;

    //albers usa projection puts alaska in the corner
    //this automatically convert latitude and longitude to coordinates on the svg canvas
    const projection = d3.geoAlbersUsa()
        .translate([width/2,height/2]);

    //set up the path generator to draw the states
    const geoGenerator = d3.geoPath().projection(projection);

    //we need to use this function to convert state names into ids so we can select individual states by name using javascript selectors
    //since spaces makes it not work correctly
    function cleanString(string){
        return string.replace(' ','_').replace(' ','_')
    }


    //This is the main loop that renders the code once the data loads
    //TODO: edit or replace this code to create your white-hat version of the map view; for example, change the color map based on colorbrewer2, 
    const mapGroupSelection = useMemo(()=>{
        //wait until the svg is rendered and data is loaded
        if(svg !== undefined & props.map !== undefined & props.data !== undefined){

            const stateData = props.data.states;

            //EDIT THIS TO CHANGE WHAT IS USED TO ENCODE COLOR
            const getEncodedFeature = d => [d.count, ((d.count/d.population)*1000000)]

            //this section of code sets up the colormap
            // console.log("STATE DATA = ", Object.values(stateData).map(getEncodedFeature)[0]);
            const stateCounts1 = Object.values(stateData).map(getEncodedFeature)[0];
            
            const stateCounts2 = Object.values(stateData).map(getEncodedFeature)[1];
            
            //get color extends for the color legend
            const [stateMin,stateMax] = d3.extent(stateCounts1);
            const [stateMin2,stateMax2] = d3.extent(stateCounts2);
            // const stateMin2 = 56
            // const stateMax2 = 92

            //color map scale, scales numbers to a smaller range to use with a d3 color scale
            //we're using 1-0 to invert the red-yellow-green color scale
            //so red is bad (p.s. this is not a good color scheme still)

            const colorPalette  = [
                "(255,245,240)",
                "(254,224,210)",
                "(252,187,161)",
                "(252,146,114)",
                "(251,106,74)",
                "(239,59,44)",
                "(203,24,29)",
                "(165,15,21)",
                "(103,0,13)"
            ]
            const stateScale = d3.scaleLinear()
                .domain([9,stateMax2-182])
                .range([0, 1]);

            //TODO: EDIT HERE TO CHANGE THE COLOR SCHEME
            //this function takes a number 0-1 and returns a color
            const colorMap = d3.interpolateReds;

            //this set of functions extracts the features given the state name from the geojson
            function getCount(name){
                //map uses full name, dataset uses abreviations
                name = cleanString(name);
                let entry = stateData.filter(d=>d.state===name);
                if(entry === undefined | entry.length < 1){
                    return 0
                }
                return getEncodedFeature(entry[0]);
            }
            function getStateVal(name){
                let count = getCount(name);
                console.log("getCount = ", count);
                let valCount = stateScale(count[0]);
                let valDPC = stateScale(count[1]);
                console.log("valCount, ValDPC = ", valCount, valDPC);
                return [valCount, valDPC]
            }
            // console.log(d3.extent(stateCounts));
            // console.log("stateScale = ", stateScale);
            // console.log("getStateVal(California) = ", getStateVal("California"));
            // console.log("getStateVal(Colorado) = ", getStateVal("Colorado"));
            function getStateColor(d){
                console.log("statescale domain = ", stateMin2, stateMax2);
                // console.log("getStateVal = ", getStateVal(d.properties.NAME));
                console.log("input to colormap = ", getStateVal(d.properties.NAME)[1]);
                return colorMap(getStateVal(d.properties.NAME)[1])
            }

            //clear earlier drawings
            svg.selectAll('g').remove();

            //OPTIONAL: EDIT THIS TO CHANGE THE DETAILS OF HOW THE MAP IS DRAWN
            //draw borders from map and add tooltip
            let mapGroup = svg.append('g').attr('class','mapbox');
            mapGroup.selectAll('path').filter('.state')
                .data(props.map.features).enter()
                .append('path').attr('class','state')
                //ID is useful if you want to do brushing as it gives you a way to select the path
                .attr('id',d=> cleanString(d.properties.NAME))
                .attr('d',geoGenerator)
                .attr('fill',getStateColor)
                .attr('stroke','black')
                .attr('stroke-width',.1)
                .on('mouseover',(e,d)=>{
                    let state = cleanString(d.properties.NAME);
                    //this updates the brushed state
                    if(props.brushedState !== state){
                        props.setBrushedState(state);
                    }
                    // console.log("AVAILABLE INFO STATE = ", d);
                    let sname = d.properties.NAME;
                    let countPM = getCount(sname)[1];
                    let count = getCount(sname)[0]
                    let text = sname + '</br>'
                        + 'Total Deaths: ' + count + '</br>'
                        + 'Population: ' + (1000000*(count/countPM)).toFixed(2) + '</br>'
                        + 'Gun Deaths/Million residents: ' + countPM.toFixed(2);
                    tTip.html(text);
                }).on('mousemove',(e)=>{
                    //see app.js for the helper function that makes this easier
                    props.ToolTip.moveTTipEvent(tTip,e);
                }).on('mouseout',(e,d)=>{
                    props.setBrushedState();
                    props.ToolTip.hideTTip(tTip);
                });


            //TODO: replace or edit the code below to change the city marker being used. Hint: think of the cityScale range (perhaps use area rather than radius). 
            //draw markers for each city
            const minDotSize = 1
            const cityData = props.data.cities
            const cityMax = d3.max(cityData.map(d=>d.count));
            const cityScale = d3.scaleLinear()
                .domain([0,cityMax])
                .range([0, 5*maxRadius]);

            mapGroup.selectAll('.city').remove();

            //TODO: Add code for a tooltip when you mouse over the city (hint: use the same code for the state tooltip events .on... and modify what is used for the tTip.html)
            //OPTIONAL: change the color or opacity
            mapGroup.selectAll('.city')
                .data(cityData).enter()
                .append('circle').attr('class','city')
                .attr('id',d=>d.key)
                .attr('cx',d=> projection([d.lng,d.lat])[0])
                .attr('cy',d=> projection([d.lng,d.lat])[1])
                .attr('r',d=>(minDotSize + 1.5*Math.sqrt(cityScale(d.count))))
                .attr('opacity',.7)
                .on('mouseover',function(e, d) {
                    let city = cleanString(d.city);
                    //this updates the brushed state
                    if(props.brushedState !== city){
                        props.setBrushedState(city);
                    }
                    // d3.select('circle').attr('opacity', 1)
                    // console.log("THIS EVENT = ", e.target.attr('opacity', 1));
                    d3.select(this).attr('r', d => (minDotSize + Math.sqrt(cityScale(d.count)))*1.5);
                    d3.select(this).attr('fill', 'red');
                    let cname = d.city;
                    let count = d.count;
                    let pop = d.population;
                    let deathsPC = 100000*(count/pop)
                    // console.log("AVAILABLE INFO = ", d);
                    let text = cname + '</br>'
                        + 'Gun Deaths: ' + count
                    tTip.html(text);
                }).on('mousemove',(e)=>{
                    //see app.js for the helper function that makes this easier
                    props.ToolTip.moveTTipEvent(tTip,e);
                }).on('mouseout', function(e, d) {
                    d3.select(this).attr('r', d => (minDotSize + 1.5*Math.sqrt(cityScale(d.count))));
                    d3.select(this).attr('fill', 'black');
                    props.setBrushedState();
                    props.ToolTip.hideTTip(tTip);
                });

            
            //draw a color legend, automatically scaled based on data extents
            function drawLegend(){
                let bounds = mapGroup.node().getBBox();
                const barHeight = Math.min(height/10,40);
                
                let legendX = bounds.x + 10 + bounds.width;
                const barWidth = Math.min((width - legendX)/3,40);
                const fontHeight = Math.min(barWidth/2,16);
                let legendY = bounds.y + 2*fontHeight;
                
                
                let colorLData = [];
                let ctr = 0;
                //OPTIONAL: EDIT THE VALUES IN THE ARRAY TO CHANGE THE NUMBER OF ITEMS IN THE COLOR LEGEND
                for(let ratio of [0,.2,.3,.4,.6,.7,.8,.9,1]){
                    let val = (1-ratio)*9 + ratio*92;
                    let valNum = (1-ratio)*9 + ratio*92;
                    let scaledVal = stateScale(val);
                    let color = colorMap(scaledVal);
                    ctr += 1;
                    let entry = {
                        'x': legendX,
                        'y': legendY,
                        'value': valNum,
                        'color':color,
                    }
                    entry.text = (entry.value).toFixed(0);
            
                    colorLData.push(entry);
                    legendY += barHeight;
                }

                svg.selectAll('.legendRect').remove();
                svg.selectAll('.legendRect')
                    .data(colorLData).enter()
                    .append('rect').attr('class','legendRect')
                    .attr('x',d=>d.x)
                    .attr('y',d=>d.y)
                    .attr('fill',d=>d.color)
                    .attr('opacity', 0.8)
                    .attr('height',barHeight)
                    .attr('width',barWidth);
    
                svg.selectAll('.legendText').remove();
                const legendTitle = {
                    'x': legendX - barWidth,
                    'y': bounds.y,
                    'text': 'Gun Deaths Per Million Residents' 
                }
                svg.selectAll('.legendText')
                    .data([legendTitle].concat(colorLData)).enter()
                    .append('text').attr('class','legendText')
                    .attr('x',d=>d.x+barWidth+5)
                    .attr('y',d=>d.y+barHeight/2 + fontHeight/4)
                    .attr('font-size',(d,i) => i == 0? 1.2*fontHeight:fontHeight)
                    .text(d=>d.text);
            }

            drawLegend();
            return mapGroup
        }
    },[svg,props.map,props.data])

    //This adds zooming. Triggers whenever the function above finishes
    //this section can be included in the main body but is here as an example 
    //of how to do multiple hooks so updates don't have to occur in every state
    useMemo(()=>{
        if(mapGroupSelection === undefined){ return }
        
        //set up zooming
        function zoomed(event) {
            const {transform} = event;
            mapGroupSelection
                .attr("transform", transform)
               .attr("stroke-width", 1 / transform.k);
        }

        const zoom = d3.zoom()
            .on("zoom", zoomed);

        //OPTIONAL: EDIT THIS CODE TO CHANGE WHAT HAPPENS WHEN YOU CLICK A STATE
        //useful if you want to add brushing
        function clicked(event, d) {
            event.stopPropagation();
            if(isZoomed){
                mapGroupSelection.transition().duration(300).call(
                    zoom.transform,
                    d3.zoomIdentity.translate(0,0),
                    d3.pointer(event,svg.node())
                )
                    
            }
            else{
                //get bounds of path from map
                const [[x0, y0], [x1, y1]] = geoGenerator.bounds(d);
                //zoom to bounds
                mapGroupSelection.transition().duration(750).call(
                    zoom.transform,
                    d3.zoomIdentity
                    .translate(width / 2, height / 2)
                    .scale(Math.min(8, 0.9 / Math.max((x1 - x0) / width, (y1 - y0) / height)))
                    .translate(-(x0 + x1) / 2, -(y0 + y1) / 2),
                    d3.pointer(event, svg.node())
                );
            }
            //sets the zoomed state property in the main app when we click on something
            //if we are zoomed in, unzoom instead
            isZoomed = !isZoomed;
            if(isZoomed){
                props.setZoomedState(d.properties.NAME);
            } else{
                props.setZoomedState(undefined);
            }
        }
        

        mapGroupSelection.selectAll('.state')
            .attr('cursor','pointer')//so we know the states are clickable
            .on('click',clicked);

    },[mapGroupSelection]);

    //OPTIONAL: EDIT HERE TO CHANGE THE BRUSHING BEHAVIOUR IN THE MAP WHEN MOUSING OVER A STATE
    //WILL UPDATE WHEN THE "BRUSHEDSTATE" VARIABLE CHANGES
    //brush the state by altering it's opacity when the property changes
    //brushed state can be on the same level but that makes it harder to use in linked views
    //so its in the parent app to simplify the "whitehat" part which uses linked views.
    useMemo(()=>{
        if(mapGroupSelection !== undefined){
            const isBrushed = props.brushedState !== undefined;
            mapGroupSelection.selectAll('.state')
                .attr('opacity',isBrushed? .4:.8)
                .attr('strokeWidth',isBrushed? 1:2);
            if(isBrushed){
                mapGroupSelection.select('#'+props.brushedState)
                    .attr('opacity',1)
                    .attr('strokeWidth',3);
            }
        }
    },[mapGroupSelection,props.brushedState]);
    
    return (
        <div
            className={"d3-component"}
            style={{'height':'99%','width':'99%'}}
            ref={d3Container}
        ></div>
    );
}
