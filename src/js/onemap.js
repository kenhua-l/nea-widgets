var clusterInfo = [];
var onemapTheme = 'DENGUE_CLUSTER';

var center = L.bounds([1.46905, 104.11475], [1.16, 103.502]).getCenter();
var map = L.map('mapdiv').setView([center.x, center.y], 11);
var basemap = L.tileLayer('https://maps-{s}.onemap.sg/v3/Original/{z}/{x}/{y}.png', {
  attribution: 'Map data © contributors, <a href="http://SLA.gov.sg" target="_blank" rel="noopener noreferrer">Singapore Land Authority</a><br> Dengue Cluster Information &copy; 2018',
  maxZoom: 18,
  minZoom: 11
});

basemap.addTo(map);
basemap.on('tileload', function (tileEvent) {
  tileEvent.tile.setAttribute('alt', 'Map tile image');
});

var info = L.control({ position: 'topleft', collapsed: true });
info.onAdd = function (map) {
  this._div = L.DomUtil.create('div', 'popup-info');
  this._div.innerHTML = 
    '<div class="tab-nav">' + 
    '<button type="button" data-box="dengue-cluster" class="tab-button is-active"> Dengue Cluster</button>' +
    '<button type="button" data-box="breeding-habitat" class="tab-button">Mosquito Breeding Habitat</button>' +
    '<i id="popup-toggler"></i>' +
    '</div>' +
    '<div class="popup-div">' +
    '<div id="dengue-cluster" data-box="dengue-cluster" class="tab-item is-active">' +
      'Please refer to Onemap for map of Dengue Cluster' +
    '</div>' +
    '<div id="breeding-habitat" data-box="breeding-habitat" style="display:none" class="tab-item">' +
      'There is no mosquito breeding habitat information. ' +
    '</div></div>';
  return this._div;
};

function updateInfo(poly, noZoom) {
  noZoom = noZoom || false;
  var cluster = poly.options.cluster;
  
  document.getElementById('dengue-cluster').innerHTML =
    '<p>Locality: ' + cluster.DESCRIPTION + '</p>' +
    '<p>Case Size: ' + cluster.CASE_SIZE + '</p>';
  
  var tableTemplate =
    '<div class="table-div"><table>' +
    '<thead><tr>' +
    '<th style="background:#ffffcd; width:33%">Mosquito Breeding Habitat in Homes</th>' +
    '<th style="background:#cdffcc; width:33%">Mosquito Breeding Habitat in Public Places</th>' +
    '<th style="background:#bcddff; width:33%">Mosquito Breeding Habitat in Construction Sites</th>' +
    '</tr></thead>' +
    '<tbody><tr>' +
    '<td style="background:#ffffcd;">{homebreedinfo}</td>' +
    '<td style="background:#cdffcc;">{publicbreedinfo}</td>' +
    '<td style="background:#bcddff;">{sitebreedinfo}</td>' +
    '</tr></tbody>' +
    '</table></div>';
  
  if (!cluster.HOMES && !cluster.PUBLIC_PLACES && !cluster.CONSTRUCTION_SITES) {
    document.getElementById('breeding-habitat').innerHTML = 'There is no mosquito breeding habitat information. ';
  } else {
    var homePlaces = '<ul>';
    if (!cluster.HOMES) {
      homePlaces += '<li>Nil</li>';
    } else {
      cluster.HOMES.split(',').forEach(function (place) {
        homePlaces += '<li>' + place.trim() + '</li>';
      });
    }
    
    var publicPlaces = '<ul>';
    if (!cluster.PUBLIC_PLACES) {
      publicPlaces += '<li>Nil</li>';
    } else {
      cluster.PUBLIC_PLACES.split(',').forEach(function (place) {
        publicPlaces += '<li>' + place.trim() + '</li>';
      });
    }
    
    var sitePlaces = '<ul>';
    if (!cluster.CONSTRUCTION_SITES) {
      sitePlaces += '<li>Nil</li>';
    } else {
      cluster.CONSTRUCTION_SITES.split(',').forEach(function (place) {
        sitePlaces += '<li>' + place.trim() + '</li>';
      });
    }
    
    tableTemplate = tableTemplate.replace('{homebreedinfo}', homePlaces + '</ul>');
    tableTemplate = tableTemplate.replace('{publicbreedinfo}', publicPlaces + '</ul>');
    tableTemplate = tableTemplate.replace('{sitebreedinfo}', sitePlaces + '</ul>');
    document.getElementById('breeding-habitat').innerHTML = tableTemplate;
  }
    
  if (!noZoom) {
    map.fitBounds(poly.getBounds(), { maxZoom: 16 });
  }
};
  
info.addTo(map);
$('.popup-info').hide();
attribution = map.attributionControl;
attribution.setPrefix('<img src="https://docs.onemap.sg/maps/images/oneMap64-01.png" alt="onemap logo" style="height:20px;width:20px;"/>');

// Auth stuff - sign in to onemap - get the mashup data(themes)
$.get('/data/dengue-cluster.json', function (data) {
  // check result
  data = JSON.stringify(data);
  data = JSON.parse(data);
  if (data && data.SrchResults &&
    data.SrchResults[0].ErrorMessage === undefined &&
    data.SrchResults[0].FeatCount > 0) {
    // iterate through all cluster
    var clusters = data.SrchResults;
    for (var i = 1; i < clusters.length; i++) {
      var cluster = clusters[i];
      cluster["TAG"] = cluster.DESCRIPTION.replace(/[\W_]+/g, '');
      //var img = 'https://assets.onemap.sg/icons/' + cluster.ICON_NAME; - future use
      var polyConfig = {
        color: '#e600a9',
        opacity: 1,
        weight: 3,
        fill: true,
        fillColor: '#FF00FF',
        fillOpacity: 0.2,
        cluster: cluster
      };
      
      var latlng = cluster.LatLng;
      // change latlng from string to array of arrays
      latlng = latlng.split('|');
      for (var j = 0; j < latlng.length; j++) {
        latlng[j] = [parseFloat(latlng[j].split(',')[0]), parseFloat(latlng[j].split(',')[1])];
      }

      // make marker
      // Yellow
      polyConfig.opacity = 0.6;
      polyConfig.fillOpacity = 0.4;
      polyConfig.fillColor = 'rgb(255,255,0)';
      polyConfig.color = 'rgb(211,171,44)';

      if (cluster.CASE_SIZE >= 10) {
        // Red
        polyConfig.opacity = 0.5;
        polyConfig.fillOpacity = 0.3;
        polyConfig.fillColor = 'rgb(217,11,41)';
        polyConfig.color = 'rgb(217,41,41)';
      }

      var poly = L.polygon([latlng], polyConfig).addTo(map);
      poly.on('click', function (e) {
        $('.popup-info').show();
        for (var i = 0; i < clusterInfo.length; i++) {
          clusterInfo[i].fire('reset');
        }
        this.setStyle({ opacity: 0.8, weight: 6 });
        updateInfo(this);
      });
      poly.on('reset', function (e) {
        if (this.options.cluster.CASE_SIZE >= 10) {
        this.setStyle({ opacity: 0.5, weight: 3 });
      } else {
        this.setStyle({ opacity: 0.6, weight: 3 });
      }
      });
      clusterInfo.push(poly);
    }
  } else {
    console.log('No results');
  }
}).fail(function () {
  console.log('Error connecting to OneMap');
  $('.popup-info').empty().addClass('tab-item').html('Please refer to Onemap for map of Dengue cluster');
  $('.popup-info').show();
});

var container = document.getElementsByClassName("popup-info")[0];
if (!L.Browser.touch) {
  L.DomEvent
    .disableClickPropagation(container)
    .disableScrollPropagation(container);
} else {
  L.DomEvent.disableClickPropagation(container);
}

$('#popup-toggler').on('click touchstart', function () {
  $('.popup-info').hide();
  for (var i = 0; i < clusterInfo.length; i++) {
    clusterInfo[i].fire('reset');
  }
});