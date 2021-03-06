mapboxgl.accessToken = config.mapboxgl_accesstoken;

const map = new mapboxgl.Map({
    container: 'map', // container id
    style: 'mapbox://styles/mapbox/streets-v9', // stylesheet location
    center: [-82, 30], // starting position [lng, lat]
    zoom: 8 // starting zoom
});


map.on('load', function () {
    $.ajax({
        type: 'GET',
        url: '/datasample',
        success: function (geoJson) {
            var cellSide = 3;
            var hexGrid = turf.hexGrid(turf.bbox(geoJson), cellSide, {});


            geoJson.features.forEach(function (feature, index) {
                feature.properties.pointId = index;
            });
            for (let i = 0; i < hexGrid.features.length; i++) {
                let ptsWithin = turf.pointsWithinPolygon(geoJson, hexGrid.features[i]);
                hexGrid.features[i].properties = {count: ptsWithin.features.length, hexId: i};
            }
            map.addSource('geojson', {type: 'geojson', data: geoJson});
            map.addSource('data', {type: 'geojson', data: hexGrid});

            map.addLayer({
                'id': 'hexagon',
                'type': 'fill',
                'source': 'data',
                'layout': {
                    'visibility': 'visible'
                },
                'paint': {
                    'fill-color': [
                        "interpolate", ["linear"], ["get", "count"],
                        0,
                        ["to-color", "#e8d7d3"],
                        150,
                        ["to-color", "#721802"],
                    ],
                    'fill-outline-color': '#161616',
                    'fill-opacity': 0.5
                },
                'filter': ['!in', 'hexId', ""]
            });
            map.addLayer({
                'id': 'points',
                'type': 'circle',
                'source': 'geojson',
                'layout': {
                    'visibility': 'visible'
                },
                'paint': {
                    'circle-color':
                        "#f4e242"
                },
                'filter': ['in', 'pointId', ""]
            });

            var properties = geoJson.features[0].properties;
            var propertyKeys = Object.keys(properties);
            propertyKeys.forEach(function (propertyKey) {
                generateCheckboxWithLabel(propertyKey);
            });
            generateCheckboxWithLabel('select-all');
            generateCheckboxWithLabel('select-none');

            map.on('click', function (e) {
                let width1 = 10;
                let height1 = 10;
                let selectedHexagon = map.queryRenderedFeatures([
                        [e.point.x - width1 / 2, e.point.y - height1 / 2],
                        [e.point.x + width1 / 2, e.point.y + height1 / 2]],
                    {layers: ['hexagon']});

                let hexFilter = selectedHexagon.reduce(function (hexIds, feature) {
                    hexIds.push(feature.properties.hexId);
                    return hexIds;
                }, ['!in', 'hexId']);
                var selectedPoints = [];
                var pointFilter;
                if (selectedHexagon.length > 0) {
                    for (let i = 0; i < selectedHexagon.length; i++) {
                        var pointsInHex = turf.pointsWithinPolygon(geoJson, selectedHexagon[i]);
                        for (let j = 0; j < pointsInHex.features.length; j++) {
                            selectedPoints.push(pointsInHex.features[j]);
                        }
                    }
                    pointFilter = selectedPoints.reduce(function (pointIds, feature) {
                        pointIds.push(feature.properties.pointId);
                        return pointIds;
                    }, ['in', 'pointId']);
                } else {
                    pointFilter = ['in', 'pointId', '']
                }
                map.setFilter('hexagon', hexFilter);
                map.setFilter('points', pointFilter);
            });

            var popup = new mapboxgl.Popup({
                closeButton: false,
                closeOnClick: false
            });

            map.on('mouseenter', 'points', function (e) {
                map.getCanvas().style.cursor = 'pointer';

                var coordinates = e.features[0].geometry.coordinates.slice();
                var clickedPointProperties = e.features[0].properties;
                var description = "<ul>";
                propertyKeys.forEach(function (propertyKey) {
                    if (document.getElementById(propertyKey).checked === true) {
                        description += "<li>" + propertyKey + ": " + clickedPointProperties[propertyKey] + "</li>"
                    }
                });
                description += "</ul>";
                popup.setLngLat(coordinates)
                    .setHTML(description)
                    .addTo(map);
            });
            map.on('mouseleave', 'points', function () {
                map.getCanvas().style.cursor = '';
                popup.remove();
            });
        }
    })
});

function generateCheckboxWithLabel(id) {
        var listingGroup = document.getElementById('listing-group');
        let label = document.createElement('label');
        let input = document.createElement('input');
        label.innerText = id;
        label.setAttribute('for', id);
        input.setAttribute('type', 'checkbox');
        input.setAttribute('checked', 'checked');
        input.setAttribute('id', id);
        if (id === 'select-none'){
            input.setAttribute('onclick', 'selectNoneOrAll(false, this);');
        } else if (id === 'select-all'){
            input.setAttribute('onclick', 'selectNoneOrAll(true, this);');
        }
        listingGroup.appendChild(input);
        listingGroup.appendChild(label);
}

function selectNoneOrAll(selectSwitch, checkbox) {
    let checkboxIds = getCheckboxIds();
    checkboxIds.forEach(function (checkboxId) {
        let elm = document.getElementById(checkboxId);
        elm.checked = selectSwitch;
    });
    document.getElementById('select-none').checked = !checkbox.checked;
}

function getCheckboxIds(){
    var checkboxes = document.getElementById('listing-group').children;
    var checkboxIds = [];
    for (let i = 0; i < checkboxes.length; i++) {
        if (checkboxes[i].id !== "") {
            checkboxIds.push(checkboxes[i].id)
        }
    }
    return checkboxIds;
}
