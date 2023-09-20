import React, {useEffect, useRef,useMemo} from 'react';
import useSVGCanvas from './useSVGCanvas.js';
import * as d3 from 'd3';

export default function WhiteHatStats(props){
    const d3Container = useRef(null);
    const [svg, height, width,  tTip] = useSVGCanvas(d3Container);

    const marginTop = 50;
    const marginBottom = 20;
    const marginLeft = 50;
    const marginRight = 50;

    useEffect(()=>{
        if(svg === undefined | props.data === undefined){ return }

        const data = props.data.states;
        
        const plotData = [];
        for(let state of data){
            let entry = {
                'abbreviation': state.abreviation,
                'count': state.count,
                'name': state.state,
                'genderRatio': state.male_count/state.count,
                'population': parseInt(state.population),
                'deaths_per_million': (state.count/state.population)*1000000,
                'male_deaths': state.male_count,
                'female_deaths': state.count - state.male_count
            }
            plotData.push(entry)
        }
        svg.selectAll('g').remove()

        const keys = Object.keys(plotData[0]).slice(6)
        const stack = d3.stack().keys(keys)(plotData)
        
        stack.map((d,i) => {
            d.map(d => {
              d.key = keys[i]
              return d
            })
            return d
          })
        
        const yMax = d3.max(plotData, d => {
            var val = 0
            for(var k of keys){
                val += d[k]
            }
            return val
        })

        const xScale = d3.scaleBand().domain(plotData.map(d => d.abbreviation)).range([marginLeft, width - marginRight]).padding(0.1);

        const yScale = d3.scaleLinear().domain([0, yMax]).range([height - marginBottom, marginTop])

        svg.selectAll('g').remove();
        svg.selectAll('g')
            .data(stack).enter()
            .append('g')
            .selectAll('rect')
            .data(d => d).enter()
            .append('rect')
                .attr('x', d => 5 + xScale(d.data.abbreviation))
                .attr('y', d => yScale(d[1]))
                .attr('id',d => d.data.name)
                .attr('width', 10)
                .attr('height', d => {
                    return yScale(d[0]) - yScale(d[1])
                })
                .attr('fill', d => d.key == 'male_deaths' ? 'blue' : 'red')
                .attr('opacity', .8)
                .attr('stroke', 'white')
                .attr('stroke-width', .9)
                .on('mouseover',(e,d)=>{
                    let state = d.data.name;
                    if(props.brushedState !== state){
                        props.setBrushedState(state);
                    }
                    let string = '<strong>' + d.data.name.replaceAll('_',' ') + '</strong>' + '</br>'
                        + '<div class="toolTipTextStyle">' + 'Gun Deaths:' + d.data.count +'</div>'
                        + '<div class="toolTipTextStyle">' + 'Gun Deaths per million: ' + d.data.deaths_per_million.toFixed(2) + '</div>'
                        + '<div class="toolTipTextStyle">' + 'Male victims: ' + d.data.male_deaths + '</div>'
                        + '<div class="toolTipTextStyle">' + 'Female victims: '+ d.data.female_deaths + '</div>'
                    props.ToolTip.moveTTipEvent(tTip,e)
                    tTip.html(string)
                }).on('mousemove',(e)=>{
                    props.ToolTip.moveTTipEvent(tTip,e);
                }).on('mouseout',(e,d)=>{
                    props.setBrushedState();
                    props.ToolTip.hideTTip(tTip);
                });

        svg.append('g')
            .call(d3.axisBottom(xScale))
            .attr('transform', `translate(0,${height - marginBottom})`)
            .attr('class', 'x-axis')
            .selectAll('text')
            .attr('transform', 'rotate(-45)')
            .style('text-anchor', 'end');
    
        svg.append('text')
        .attr('x', width / 2)
        .attr('y', marginTop/ 2)
        .attr('text-anchor', 'middle')
        .attr('font-size', 20)
        .attr('font-weight', 'bold')
        .text('Gun Deaths across Males and Females');
        
        svg.append('text')
        .attr('x', marginLeft / 2)
        .attr('y', height)
        .attr('font-size', 15)
        .attr('text-anchor', 'middle')
        .text('State->');

        svg.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('x', -height / 2)
        .attr('y', marginLeft/2 - 10)
        .attr('font-size', 15)
        .attr('text-anchor', 'middle')
        .text('Deaths');

        svg.append('g')
            .call(d3.axisLeft(yScale))
            .attr('transform', `translate(${marginLeft},0)`)
            
        svg.append('text')
        .text('abc')

        const legendData = [
            { label: 'Male Deaths', color: 'blue' },
            { label: 'Female Deaths', color: 'red' }
            ];
              
        const legend = svg.append('g')
        .attr('class', 'legend')
        .attr('transform', `translate(${width - 130}, 20)`);
        
        const legendItems = legend.selectAll('.legend-item')
        .data(legendData)
        .enter().append('g')
        .attr('class', 'legend-item')
        .attr('transform', (d, i) => `translate(0, ${i * 20})`);
        
        legendItems.append('rect')
        .attr('width', 10)
        .attr('height', 10)
        .attr('fill', d => d.color)
        .attr('opacity', 0.8);
        
        legendItems.append('text')
        .attr('x', 20)
        .attr('y', 8)
        .attr('dy', '0.35em')
        .text(d => d.label);
                  
    },[props.data,svg]);

    return (
        <div
            className={"d3-component"}
            style={{'height':'99%','width':'99%'}}
            ref={d3Container}
        ></div>
    );
}