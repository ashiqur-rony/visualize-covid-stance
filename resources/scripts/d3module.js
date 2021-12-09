import * as d3 from "https://cdn.skypack.dev/d3@7";

window.onload = function () {
    Promise.all( [d3.csv( "resources/data/monthly_topics.csv" ),
        d3.csv( "resources/data/user_cumulative_score.csv" )] )
        .then( createVisualization );
};

/**
 * Define global variables
 */

let monthly_topics, user_sentiments, attributes, dates, month, topics_svg, y_scale, sentiment_svg;

/**
 * Format the months as Month YYYY
 **/
const formatMonths = d3.timeFormat( '%B %Y' );

let sentiment_x_scale, sentiment_y_scale;

function visualizeTopics( monthly_topics, month, attributes, topics_svg, y_scale ) {
    // Filter the dataset with current month
    const current_month_topics = monthly_topics.filter( d => formatMonths( d.month ).toLowerCase().replaceAll( ' ', '-' ) === month );
    // Group the topics by topic name
    const grouped_topics = d3.rollup( current_month_topics, v => d3.sum( v, d => d.score ), d => d.topic );
    const grouped_topics_count = d3.rollup( current_month_topics, v => d3.count( v, d => d.score ), d => d.topic );

    //Start the visualization

    // X axis
    // Topics will be displayed on the x-axis

    // Get the unique topics from monthly topics object
    const topics = [...new Set( current_month_topics.map( e => e.topic ) )];

    const x_domains = topics.sort( d3.ascending );

    // X axis scale
    const x_scale = d3.scaleBand()
        .domain( x_domains )
        .range( [attributes.axis.y, attributes.width_topic] )
        .padding( 1 );

    const x_axis = d3.axisBottom( x_scale );

    // Add X axis
    topics_svg.select( 'g.axis.x' )
        .call( x_axis )
        .selectAll( 'text' )
        .attr( 'y', 0 )
        .attr( 'x', -15 )
        .attr( 'dy', '.35em' )
        .attr( 'transform', 'rotate(270)' )
        .style( 'text-anchor', 'end' );

    // Color Scheme
    const topic_color = d3.scaleOrdinal()
        .domain( x_domains )
        .range( d3.schemeCategory10 );

    // Transition
    const t = topics_svg.transition().duration( 750 );

    // Add the circles
    topics_svg.selectAll( '.bubble' )
        .data( grouped_topics.keys() )
        .join( 'circle' )
        .attr( 'class', d => 'bubble bubble-' + d.toLowerCase().replace( /[.\s]+/g, '-' ) )
        .attr( 'data-topic', d => d.toLowerCase().replace( /[.\s]+/g, '-' ) )
        .on( 'mouseover', handleMouseOverTopicBubble )
        .on( 'mouseout', handleMouseOutTopicBubble )
        .transition( t )
        .attr( 'cx', d => x_scale( d ) )
        .attr( 'cy', d => y_scale( grouped_topics.get( d ) ) )
        .attr( 'r', d => Math.ceil( grouped_topics_count.get( d ) / 5 ) )
        .style( 'fill', d => topic_color( d ) );
}

function visualizeSentiment( user_sentiments, month, attributes, sentiment_svg, x_scale, y_scale ) {
    // Set the global scales for tooltip
    sentiment_x_scale = x_scale;
    sentiment_y_scale = y_scale;

    // Filter the dataset with current month
    const current_month_sentiments = user_sentiments.filter( d => formatMonths( d.month ).toLowerCase().replaceAll( ' ', '-' ) === month );
    // Group the topics by topic name
    const grouped_users = d3.rollup( current_month_sentiments, v => d3.sum( v, d => d.score ), d => d.topic );

    // Color Schemes

    // Show color if date is in range
    const sentiment_color_scheme = d3.scaleOrdinal()
        .domain( d3.group( user_sentiments, d => d.user_screen_name ).keys() )
        .range( d3.schemeSet3 );

    // Show gray otherwise
    const gray_color_scheme = d3.scaleOrdinal()
        .domain( d3.group( user_sentiments, d => d.user_screen_name ).keys() )
        .range( ['#eaeaea'] );

    // Check if the data is within current month
    // Then either show the data point in color or in gray
    const sentiment_color = function ( d ) {
        if ( d.month.getTime() <= new Date( '01' + month.replace( '-', ' ' ) ).getTime() ) {
            return sentiment_color_scheme( d )
        } else {
            return gray_color_scheme( d );
        }
    };

    // Transition
    const t = sentiment_svg.transition().duration( 750 );

    sentiment_svg.append( 'g' )
        .selectAll( '.bubble' )
        .data( user_sentiments )
        .join( 'circle' )
        .attr( 'class', d => 'bubble bubble-' + d.user_screen_name.toLowerCase().replace( /[.\s]+/g, '-' ) + ' ' + d.topic.replaceAll( '[', '' ).replaceAll( ']', '' ).replaceAll( '\'', '' ) )
        .attr( 'data-user', d => d.user_screen_name.toLowerCase().replace( /[.\s]+/g, '-' ) )
        .attr( 'data-score', d => d.cumulative_sentiment )
        .on( 'mouseover', handleMouseOverBubble )
        .on( 'mouseout', handleMouseOutBubble )
        .on( 'click', handleMouseClickBubble )
        .attr( 'cx', d => x_scale( d.month ) )
        .attr( 'cy', d => y_scale( d.cumulative_sentiment ) )
        .attr( 'r', 5 )
        .style( 'fill', d => sentiment_color( d ) )
        .transition( t );
}

function handleMouseOverTopicBubble( d, i ) {
    const sentiment_svg = d3.select( '#sentiment-visualization' ).select( 'svg' );
    sentiment_svg.selectAll( '.bubble' )
        .style( 'opacity', 0 )
        .style( 'z-index', 1 );
    sentiment_svg.selectAll( '.bubble.' + i )
        .style( 'opacity', 1 )
        .style( 'z-index', 99 )
        .raise();

    const topic_svg = d3.select( '#topic-visualization' ).select( 'svg' );
    topic_svg.selectAll( 'circle:not(.bubble-' + i )
        .style( 'opacity', 0.2 )
        .style( 'z-index', 1 )
        .raise();
}

function handleMouseOutTopicBubble( d, i ) {
    const sentiment_svg = d3.select( '#sentiment-visualization' ).select( 'svg' );
    sentiment_svg.selectAll( '.bubble' )
        .style( 'opacity', 1 )
        .style( 'z-index', 99 );
    const topic_svg = d3.select( '#topic-visualization' ).select( 'svg' );
    topic_svg.selectAll( 'circle.bubble' )
        .style( 'opacity', 1 )
        .style( 'z-index', 99 );
}

function handleMouseOverBubble( d, i ) {
    const sentiment_svg = d3.select( '#sentiment-visualization' ).select( 'svg' );
    const tweet_texts = i.text.replaceAll( /@\w+/ig, '@<user>' ).replaceAll( /RT@\w+:/ig, '' ).match( /.{1,120}/g );
    const topics = i.topic.replaceAll( '[', '' ).replaceAll( ']', '' ).replaceAll('\'', '').split( ' ' );

    d3.selectAll('.bubble')
        .style('opacity', 0.5);

    d3.select(d.target)
        .style('opacity', 1)
        .style('stroke-width', '1px')
        .style('stroke', 'black')
        .raise();

    const text_node = sentiment_svg
        .append( 'g' )
        .attr( 'id', 't' + Date.parse( i.created_at ) + '-' + i.user_screen_name )
        .attr( 'class', 'sentiment-tooltip' )
        .append( "text" )
        .attr( 'x', 120 )
        .attr( 'dx', 0 )
        .attr( 'y', 20 );
    text_node.append( 'tspan' )
        .attr( 'x', 120 )
        .attr( 'dy', '1.2em' )
        .text( 'Score: ' + i.cumulative_sentiment );
    text_node.append( 'tspan' )
        .attr( 'x', 120 )
        .attr( 'dy', '1.2em' )
        .text( 'Primary topic: ' + (topics.length > 0 ? topics[0].replaceAll( '\'', '' ).trim() : 'NA') );

    if(topics.length > 1) {
        topics.splice(0, 1);
        text_node.append( 'tspan' )
            .attr( 'x', 120 )
            .attr( 'dy', '1.2em' )
            .attr( 'class', 'other-topics' )
            .text( 'Other topics: ' + topics.join(', ') );
    }

    tweet_texts.forEach( ( text ) => {
        text_node.append( 'tspan' )
            .attr( 'x', 120 )
            .attr( 'dy', '1.2em' )
            .attr( 'class', 'tweet-text' )
            .text( text );
    } );

    const topic_svg = d3.select( '#topic-visualization' ).select( 'svg' );
    if ( topics.length > 0 ) {
        topic_svg.selectAll( 'circle:not(.bubble-' + topics[0].replaceAll( '\'', '' ).trim() + ')' )
            .style( 'opacity', 0.2 )
            .style( 'z-index', 1 );
        topic_svg.selectAll( '.bubble-' + topics[0].replaceAll( '\'', '' ).trim() )
            .style( 'opacity', 1 )
            .style( 'z-index', 99 )
            .raise();
    }

}

function handleMouseOutBubble( d, i ) {
    const sentiment_svg = d3.select( '#sentiment-visualization' ).select( 'svg' );
    sentiment_svg.select( "#t" + Date.parse( i.created_at ) + "-" + i.user_screen_name ).remove();
    sentiment_svg.selectAll('.bubble')
        .style('opacity', 1)
        .style('stroke-width', '0px')
        .style('stroke', 'none');

    const topic_svg = d3.select( '#topic-visualization' ).select( 'svg' );
    topic_svg.selectAll( 'circle.bubble' )
        .style( 'opacity', 1 )
        .style( 'z-index', 99 );
}

function handleMouseClickBubble( d, i ) {

}

/**
 * Function to create the visualization
 * @param data array of CSV data elements
 */
function createVisualization( data ) {

    // Prepare the monthly topics with appropriate type conversion
    monthly_topics = data[0].map( ( d ) => {
        return {
            'month': new Date( '01' + d.Month.trim() ),       // Convert string months to date object
            'topic': d.Topic.trim().replaceAll( "'", '' ),    // Trim empty space and quotes
            'score': parseFloat( d.Score.trim() ).toFixed( 4 )  // Convert to floating point number
        }
    } );

    // Prepare the user sentiments with appropriate type conversion
    user_sentiments = data[1].map( ( d ) => {
        return {
            'month': new Date( '01' + d.Month.trim() ),
            'created_at': new Date( d.created_at.trim() ),
            'cumulative_sentiment': parseFloat( d.cumulative_sentiment.trim() ).toFixed( 4 ),
            'user_screen_name': d.user_screen_name.trim(),
            'text': d.text,
            'topic': d.topic
        }
    } );

    // Attributes of the SVG visualization
    attributes = {
        width_topic: 600,
        height_topic: 350,
        width_sentiment: 900,
        height_sentiment: 600,
        margin: {
            top: 20,
            right: 20,
            bottom: 20,
            left: 20
        },
        axis: {
            x: 100,
            y: 100
        }
    };

    // Get the unique dates from the monthly topics object
    dates = monthly_topics.map( e => e.month )
        .filter( ( e, index, self ) =>
            self.findIndex( d => d.getTime() === e.getTime() ) === index );

    // Set current month to the first value of the list
    month = formatMonths( dates[0] ).toLowerCase().replaceAll( ' ', '-' );

    // Create the SVG
    topics_svg = d3.select( '#topic-visualization' )
        .append( 'svg' )
        .attr( 'width', attributes.width_topic )
        .attr( 'height', attributes.height_topic )
        .attr( 'viewBox', [0, 0, attributes.width_topic, attributes.height_topic] )
        .attr( 'style', 'max-width: 100%; height: auto; height: intrinsic;' );

    // Create the x axis
    const x_axis = topics_svg.append( 'g' )
        .attr( 'class', 'x axis' )
        .attr( 'transform', 'translate(0, ' + (attributes.height_topic - attributes.axis.x) + ')' );

    // Create the y axis

    // Get the extent of the scores from all months
    const g = d3.rollup( monthly_topics, v => d3.sum( v, d => d.score ), d => d.month, d => d.topic );
    let scores = [];
    g.forEach( ( value, key ) => {
        scores = scores.concat( d3.extent( g.get( key ).values() ) );
    } );

    // The scores will be displayed on the y-axis
    y_scale = d3.scaleLinear()
        .range( [0, attributes.height_topic - attributes.axis.x] )
        .domain( [d3.extent( scores ).reverse()[0] + 10, d3.extent( scores ).reverse()[1]] );

    const y_axis = d3.axisLeft( y_scale );

    // We don't need to create the Y-axis for every month.
    topics_svg.append( 'g' )
        .call( y_axis )
        .attr( 'class', 'y axis' )
        .attr( 'transform', 'translate(' + (attributes.axis.x) + ', 0)' )
        .selectAll( 'text' )
        .style( 'text-anchor', 'end' );

    visualizeTopics( monthly_topics, month, attributes, topics_svg, y_scale );

    // Visualize sentiment

    // Get the unique dates from the monthly topics object
    const unique_users = [...new Set( user_sentiments.map( d => d.user_screen_name ) )];

    // Sentiment SVG
    sentiment_svg = d3.selectAll( '#sentiment-visualization' )
        .append( 'svg' )
        .attr( 'width', attributes.width_sentiment )
        .attr( 'height', attributes.height_sentiment )
        .attr( 'viewBox', [0, 0, attributes.width_sentiment, attributes.height_sentiment] )
        .attr( 'style', 'max-width: 100%; height: auto; height: intrinsic;' );

    // X axis
    const sentiment_x_domains = dates;
    sentiment_x_scale = d3.scaleTime()
        .domain( d3.extent( sentiment_x_domains ) )
        .range( [attributes.axis.y + 10, attributes.width_sentiment - 10] )
        .nice();

    const sentiment_x_axis = d3.axisBottom( sentiment_x_scale )
        .tickFormat( d3.timeFormat( '%B %Y' ) );

    sentiment_svg.append( 'g' )
        .attr( 'class', 'x axis' )
        .call( sentiment_x_axis )
        .attr( 'transform', 'translate(0, ' + (attributes.height_sentiment - attributes.axis.x) + ')' )
        .selectAll( 'text' )
        .attr( 'y', 0 )
        .attr( 'x', -15 )
        .attr( 'dy', '.35em' )
        .attr( 'transform', 'rotate(270)' )
        .style( 'text-anchor', 'end' );

    // Y axis
    const cumulative_sentiment_score_extent = d3.extent( user_sentiments.map( d => parseFloat( d.cumulative_sentiment ) ) ).reverse();
    sentiment_y_scale = d3.scaleLinear()
        .range( [0, attributes.height_sentiment - attributes.axis.x] )
        .domain( [cumulative_sentiment_score_extent[0] + 10, cumulative_sentiment_score_extent[1] - 10] );

    const sentiment_y_axis = d3.axisLeft( sentiment_y_scale );

    // We don't need to create the Y-axis for every month.
    sentiment_svg.append( 'g' )
        .call( sentiment_y_axis )
        .attr( 'class', 'y axis' )
        .attr( 'transform', 'translate(' + attributes.axis.x + ', 0)' )
        .selectAll( 'text' )
        .style( 'text-anchor', 'end' );

    visualizeSentiment( user_sentiments, month, attributes, sentiment_svg, sentiment_x_scale, sentiment_y_scale );

    // Show the months on the screen
    {
        d3.select( '#months' )
            .append( 'input' )
            .attr( 'type', 'range' )
            .attr( 'min', 0 )
            .attr( 'max', dates.length - 1 )
            .attr( 'value', 0 )
            .attr( 'step', 1 )
            .attr( 'id', 'month-range' )
            .attr( 'class', 'month-range' );

        d3.select( '#selected-month-label' )
            .text( formatMonths( dates[0] ) );

        d3.select( 'input#month-range' )
            .on( 'change', function () {
                redrawViz( );
            } );
    }

    //Show the users in dropdown
    {
        const user_filter_select = d3.select( '#users' )
            .append( 'select' )
            .attr( 'id', 'user-filter' )
            .attr( 'class', 'user-filter' );

        user_filter_select.append( 'option' )
            .attr( 'value', 'all' )
            .attr( 'selected', 'selected' )
            .text( 'All' );

        unique_users.forEach( user => {
            user_filter_select.append( 'option' )
                .attr( 'value', user.toLowerCase().replace( /[.\s]+/g, '-' ) )
                .text( user );
        } );

        const sentiment_svg_backup = sentiment_svg;

        user_filter_select.on( 'change', ( d ) => {
            let selected_user = d3.select( d.target ).property( 'value' ).toLowerCase().replace( /[.\s]+/g, '-' );

            if ( selected_user !== 'all' ) {

                sentiment_svg.selectAll( '.bubble' )
                    .style( 'fill', '#eaeaea' )
                    .style( 'opacity', 0.3 )
                    .style( 'z-index', 1 );
                sentiment_svg.selectAll( '.bubble-' + selected_user )
                    .style( 'fill', '#993333' )
                    .style( 'opacity', 1 )
                    .style( 'z-index', 99 )
                    .raise();
            } else {
                sentiment_svg.selectAll( '.bubble' )
                    .style( 'fill', '#eaeaea' )
                    .style( 'opacity', 0.3 )
                    .style( 'z-index', 1 );
                redrawViz();
            }
        } );
    }
}

function redrawViz( ) {
    const element = d3.select( 'input#month-range' ).node();

    const selected_value = element.value;
    const min = element.min ? element.min : 0;
    const max = element.max ? element.max : dates.length - 1;
    const new_value = Number( ((selected_value - min) * 100) / (max - min) );
    const deduction = 0.17 * new_value;
    const current_month = dates[selected_value];

    d3.select( '#selected-month-label' )
        .text( formatMonths( current_month ) )
        .style( 'left', `calc(${new_value}% - ${deduction}px)` );

    // Update the visualization
    month = formatMonths( current_month ).toLowerCase().replaceAll( ' ', '-' );
    visualizeTopics( monthly_topics, month, attributes, topics_svg, y_scale );
    visualizeSentiment( user_sentiments, month, attributes, sentiment_svg, sentiment_x_scale, sentiment_y_scale );
}
