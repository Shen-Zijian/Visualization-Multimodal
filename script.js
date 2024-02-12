// 创建地图并设置中心和缩放级别
var mymap = L.map('mapid', {zoomControl: false}).setView([40.743132,-73.9893927], 14);

// 添加地图图层
// 创建地图并设置中心和缩放级别

// 添加暗色底图图层
L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    maxZoom: 18,
    id: 'mapbox/light-v10',
    tileSize: 512,
    zoomOffset: -1,
    accessToken: 'pk.eyJ1IjoibWF0dGp3YW5nIiwiYSI6ImNsaXB5NDN1cTAzMnAza28xaG54ZWRrMzgifQ.cUju1vqjuW7XmAuO2iEZmg'  // 将此处替换为你的Mapbox访问令牌
}).addTo(mymap);

//meeting point
var pulsingIcon = L.icon.pulse({iconSize:[10,10],color:'red'});


// 图例
fetch('Multimodal_data.json')
    .then(response => response.json())
    .then(data => {
   var legend = L.control({ position: 'topleft' });
legend.onAdd = function (map) {
    var div = L.DomUtil.create('div', 'info legend');
    div.style.backgroundColor = '#333333';
    div.style.padding = '10px';
    div.style.color = 'white';

    // 添加图例项数组
    var items = [
        { src: './img/walking_rider.png', label: 'Rider', width: 20, height: 20 },
        { src: './img/shuttlebus.png', label: 'Shuttle Bus', width: 15, height: 25 },
        { src: './img/taxi.png', label: 'Taxi', width: 15, height: 25 },
        { src: './img/subway.png', label: 'Subway', width: 15, height: 35 },
        { src: './img/meeting_point.png', label: 'Meeting Point', width: 20, height: 20 }
    ];

    // 遍历创建每个图例项
    items.forEach(function(item) {
        var row = L.DomUtil.create('div', '', div);
        row.style.display = 'flex';
        row.style.alignItems = 'center';
        row.style.justifyContent = 'flex-start';
        row.style.padding = '2px 0';

        // 创建图标
        var icon = L.DomUtil.create('img', '', row);
        icon.src = item.src;
        icon.width = item.width;
        icon.height = item.height;
        icon.style.marginRight = '5px';

        // 创建居中的文本
        var label = L.DomUtil.create('div', '', row);
        label.innerHTML = item.label;
        label.style.flex = '1';
        label.style.textAlign = 'center';
    });

    return div;
};
legend.addTo(mymap);

//图标旋转
// 获取下一个点的位置
function getNextLatLng(routeID, index) {
    if (index < data[routeID].length - 1) {
        return [data[routeID][index + 1][0], data[routeID][index + 1][1]];
    } else {
        return null;
    }
}

// 计算两个点之间的角度
function calculateAngle(position1, position2) {
    var dy = position2[1] - position1[1];
    var dx = position2[0] - position1[0];
    var theta = Math.atan2(dy, dx);
    theta *= 180 / Math.PI; // Radians to Degrees
    if (theta < 0) {
        theta = 360 + theta;
    }
    return theta;
}



// 车辆轨迹
const interval = 1000;
// 为每个routeID创建一个marker，并存储在一个字典中
var markers = {};
var i = 0;

//图标

var walkingRiderIcon = L.icon({
    iconUrl: './img/walking_rider.png',
    iconSize: [15, 20], // 图标的大小
});


var shuttleBusIcon = L.icon({
    iconUrl: './img/shuttlebus.png',
    iconSize: [15, 25], // 图标的大小
});

var cabIcon = L.icon({
    iconUrl: './img/taxi.png',
    iconSize: [15, 25], // 图标的大小
});

var subwayIcon = L.icon({
    iconUrl: './img/subway.png',
    iconSize: [15, 35], // 图标的大小
});

for (var routeID in data) {
    // console.log(routeID)
    var vehicon;
    var positionData = data[routeID][0]; // 获取包含经度、纬度和类型的数组
    var nextPositionData = data[routeID][1];

    if (positionData[2] === 'rider'){
        vehicon = walkingRiderIcon;
    }

    else if (positionData[2] === 'taxi'){
            vehicon = cabIcon;
    }
    else if (positionData[2] === 'shuttle_bus'){
            vehicon = shuttleBusIcon;
    }
    else if (positionData[2] === 'point'){
        switch(positionData[3]) { // 使用数组的第三个元素（类型）来选择图标
        case 'display':
            vehicon = pulsingIcon;
            break;
        default:
            markers[routeID].setVisible(false);  //隐藏标记
            continue;
        }
    }
    else {
        vehicon = subwayIcon;
    }

    console.log(routeID)
    var position = [[positionData[0], positionData[1]],[nextPositionData[0],nextPositionData[1]]];
    console.log(position)
    var marker = L.Marker.movingMarker(position, [interval, interval], {
        autostart: false,
        loop: false,
        icon: vehicon,
    }).addTo(mymap);
     if(marker._icon){
        marker._icon.style.transitionProperty = "transform";
        marker._icon.style.transitionDuration = "0.15s";
    }
    markers[routeID] = marker;
    (function(routeID) {
        marker.on('click', function() {
            var infoDiv = document.getElementById('info');
            infoDiv.innerText = 'Vehicle ID: ' + routeID;
        });
        marker.setRotationOrigin("center center");
    })(routeID);
}

// 创建自定义控件以显示数据
var infoControl = L.control({ position: 'topright' });

infoControl.onAdd = function(map) {
    this._div = L.DomUtil.create('div', 'info'); // 创建一个带有 "info" 类的 div 元素
    // 设置样式，可以根据需要自定义
    this._div.style.backgroundColor = '#333333';
    this._div.style.padding = '6px 8px';
    this._div.style.margin = '5px';
    this._div.style.borderRadius = '5px';
    this._div.style.boxShadow = '0 0 15px rgba(0,0,0,0.2)';
    this._div.style.color = 'white';
    this._div.style.fontSize = '14px';
    this._div.style.lineHeight = '1.4';
    this._div.style.fontFamily = 'Arial, sans-serif';
    this.update();
    return this._div;
};

infoControl.update = function(data) {
    var dataPoints = [
        'matched_rider_cnt',
        'OrgPickup_cnt',
        'reposition_recommend_cnt',
        'reposition_recommend_and_accept_cnt',
        'reposition_recommend_but_reject_cnt',
        'matching_rate',
        'unmatched_rider_cnt',
        'total_revenue',
        'total_revenue_added_by_reposition'
    ];

    this._div.innerHTML = '<h4>Route Information</h4>';
    if (data) {
        dataPoints.forEach(function(name, index) {
            var value = data[index + 4]; // 因为数据从 data[routeID][0][4] 开始
            if (value !== undefined) {
                this._div.innerHTML +=  name + ': ' + value + '<br/>';
            }
        }, this);
    } else {
        this._div.innerHTML += 'No data available';
    }
};

// 将控件添加到地图
infoControl.addTo(mymap);


// 每20000毫秒更新一次每个点的位置
setInterval(function() {

    for (var routeID in data) {
        // 移动到下一个点，移动时间为20000毫秒
        infoControl.update(data[routeID][0]);
        var marker = markers[routeID];
        if (data[routeID][0][2] === 'rider'){
        vehicon = walkingRiderIcon;
        }
        else if (data[routeID][0][2] === 'point'){
            switch(data[routeID][0][3]) { // 使用数组的第三个元素（类型）来选择图标
            case 'display':
                vehicon = pulsingIcon;
                break;
            default:
                markers[routeID].setVisible(false);  //隐藏标记
                continue;
            }
        }
        else if (data[routeID][0][2] === 'taxi'){
                vehicon = cabIcon;
        }
        else if (data[routeID][0][2] === 'shuttle_bus'){
                vehicon = shuttleBusIcon;
        }
        else {
            vehicon = subwayIcon;
        }
        markers[routeID].setIcon(vehicon);
        if (data[routeID].length > 1) {
            var newPos = [data[routeID][1][0], data[routeID][1][1]];

            // 计算角度并设置旋转
            var oldPos = [data[routeID][0][0], data[routeID][0][1]];
            var angle = calculateAngle(oldPos, newPos);
            if (angle !== 0 && data[routeID][0][2] !== 'rider') {
                markers[routeID].setRotationAngle(angle); // 设置图标旋转角度
            }

            marker.moveTo(newPos, interval);
            marker.start();

            // 删除已使用的数据点
            data[routeID].shift();
        } else {
            // 如果数组变空了，停止移动标记并隐藏它（可选）
            marker.stop();
            if (marker._icon) {
                marker._icon.style.visibility = 'hidden'; // 或者使用 marker.remove() 从地图上完全删除标记
            }
            delete data[routeID]; // 从数据对象中删除已用尽的路线ID
        }
    }
}, 500);
});

