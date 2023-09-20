import React, {useRef,useMemo} from 'react';
import useSVGCanvas from './useSVGCanvas.js';
import * as d3 from 'd3';
import { logDOM } from '@testing-library/react';

export default function Whitehat(props){
    const d3Container = useRef(null);
    const [svg, height, width, tTip] = useSVGCanvas(d3Container);
    var isZoomed = false;

    const maxRadius = width/300;
    const projection = d3.geoAlbersUsa()
        .translate([width/2,height/2]);

    const geoGenerator = d3.geoPath().projection(projection);

    function cleanString(string){
        return string.replace(' ','_').replace(' ','_')
    }

    const mapGroupSelection = useMemo(()=>{
        if(svg !== undefined & props.map !== undefined & props.data !== undefined){

            const stateData = props.data.states;

            const getEncodedFeature = d => [d.count, ((d.count/d.population)*1000000)]

            const stateCounts1 = Object.values(stateData).map(getEncodedFeature)[0];
            
            const stateCounts2 = Object.values(stateData).map(getEncodedFeature)[1];
            
            const [stateMin2,stateMax2] = d3.extent(stateCounts2);

            const stateScale = d3.scaleLinear()
                .domain([9,stateMax2-182])
                .range([0, 1]);

            const colorMap = d3.interpolateReds;

            function getCount(name){
                name = cleanString(name);
                let entry = stateData.filter(d=>d.state===name);
                if(entry === undefined | entry.length < 1){
                    return 0
                }
                return getEncodedFeature(entry[0]);
            }
            function getStateVal(name){
                let count = getCount(name);
                let valCount = stateScale(count[0]);
                let valDPC = stateScale(count[1]);
                return [valCount, valDPC]
            }
            function getStateColor(d){
                return colorMap(getStateVal(d.properties.NAME)[1])
            }

            svg.selectAll('g').remove();

            let mapGroup = svg.append('g').attr('class','mapbox');
            mapGroup.selectAll('path').filter('.state')
                .data(props.map.features).enter()
                .append('path').attr('class','state')
                .attr('id',d=> cleanString(d.properties.NAME))
                .attr('d',geoGenerator)
                .attr('fill',getStateColor)
                .attr('stroke','black')
                .attr('stroke-width',.1)
                .on('mouseover',(e,d)=>{
                    let state = cleanString(d.properties.NAME);
                    if(props.brushedState !== state){
                        props.setBrushedState(state);
                    }
                    let sname = d.properties.NAME;
                    let countPM = getCount(sname)[1];
                    let count = getCount(sname)[0]
                    let text = sname + '</br>'
                        + 'Total Deaths: ' + count + '</br>'
                        + 'Population: ' + (1000000*(count/countPM)).toFixed(2) + '</br>'
                        + 'Gun Deaths/Million residents: ' + countPM.toFixed(2);
                    tTip.html(text);
                }).on('mousemove',(e)=>{
                    props.ToolTip.moveTTipEvent(tTip,e);
                }).on('mouseout',(e,d)=>{
                    props.setBrushedState();
                    props.ToolTip.hideTTip(tTip);
                });

            const minDotSize = 1
            const cityData = props.data.cities
            const cityMax = d3.max(cityData.map(d=>d.count));
            const cityScale = d3.scaleLinear()
                .domain([0,cityMax])
                .range([0, 5*maxRadius]);

            mapGroup.selectAll('.city').remove();
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
                    if(props.brushedState !== city){
                        props.setBrushedState(city);
                    }
                    d3.select(this).attr('r', d => (minDotSize + Math.sqrt(cityScale(d.count)))*1.5);
                    d3.select(this).attr('fill', 'red');
                    let cname = d.city;
                    let count = d.count;
                    let pop = d.population;
                    let text = cname + '</br>'
                        + 'Gun Deaths: ' + count
                    tTip.html(text);
                }).on('mousemove',(e)=>{
                    props.ToolTip.moveTTipEvent(tTip,e);
                }).on('mouseout', function(e, d) {
                    d3.select(this).attr('r', d => (minDotSize + 1.5*Math.sqrt(cityScale(d.count))));
                    d3.select(this).attr('fill', 'black');
                    props.setBrushedState();
                    props.ToolTip.hideTTip(tTip);
                });

            
            function drawLegend(){
                let bounds = mapGroup.node().getBBox();
                const barHeight = Math.min(height/10,40);
                
                let legendX = bounds.x + 10 + bounds.width;
                const barWidth = Math.min((width - legendX)/3,40);
                const fontHeight = Math.min(barWidth/2,16);
                let legendY = bounds.y + 2*fontHeight;
                
                
                let colorLData = [];
                let ctr = 0;

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
                    'text': 'Deaths/Million Residents' 
                }
                svg.selectAll('.legendText')
                    .data([legendTitle].concat(colorLData)).enter()
                    .append('text').attr('class','legendText')
                    .attr('x',d=>d.x+barWidth+5)
                    .attr('y',d=>d.y+barHeight/2 + fontHeight/4)
                    .attr('font-size',(d,i) => i == 0? 1.2*fontHeight:fontHeight)
                    .attr('font-weight', 'bold')
                    .text(d=>d.text);
            }

            drawLegend();
            return mapGroup
        }
    },[svg,props.map,props.data])

    useMemo(()=>{
        if(mapGroupSelection === undefined){ return }
        
        function zoomed(event) {
            const {transform} = event;
            mapGroupSelection
                .attr("transform", transform)
               .attr("stroke-width", 1 / transform.k);
        }

        const zoom = d3.zoom()
            .on("zoom", zoomed);

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
                const [[x0, y0], [x1, y1]] = geoGenerator.bounds(d);

                mapGroupSelection.transition().duration(750).call(
                    zoom.transform,
                    d3.zoomIdentity
                    .translate(width / 2, height / 2)
                    .scale(Math.min(8, 0.9 / Math.max((x1 - x0) / width, (y1 - y0) / height)))
                    .translate(-(x0 + x1) / 2, -(y0 + y1) / 2),
                    d3.pointer(event, svg.node())
                );
            }
            isZoomed = !isZoomed;
            if(isZoomed){
                props.setZoomedState(d.properties.NAME);
            } else{
                props.setZoomedState(undefined);
            }
        }
        

        mapGroupSelection.selectAll('.state')
            .attr('cursor','pointer')
            .on('click',clicked);

    },[mapGroupSelection]);

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
