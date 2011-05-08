/*!
 * RTGSE (Real Time Geolocation Sharing Experiment) using Websockets, Google Maps and NodeJS.
 *
 * Copyright (c) 2011 Sebastien P.
 *
 * http://rtgse.nodester.com/
 * http://twitter.com/_sebastienp
 *
 * MIT licensed.
*/


// https://github.com/douglascrockford/JSON-js/blob/master/json2.js
if (!(JSON && (typeof JSON.stringify === "function"))) {

	window.JSON = {
		stringify: function (value, replacer, space) {

			var i;
				gap = "";
				indent = "";

			if (typeof space === "number") {

				for (i = 0; i < space; i += 1) {

	                    indent += " ";

				}

			} else if (typeof space === "string") {

				indent = space;

			}

			rep = replacer;

			if (replacer && typeof replacer !== "function" && (typeof replacer !== "object" || typeof replacer.length !== "number")) {

				throw new Error("JSON.stringify");

			}

			return str("", { "": value });
        
		}
	};

}

$(function () {

	var $dialog = $("#dialog").dialog({ autoOpen: !1, modal: !0 }),
		google_maps = google.maps,
		get_coords = function (position) { return new google_maps.LatLng(position.latitude, position.longitude); },
		info = new google_maps.InfoWindow(),
		zero_zero = { latitude: 0, longitude: 0 },
		map = new google_maps.Map($("#map")[0], { center: get_coords(zero_zero), mapTypeId: google_maps.MapTypeId.ROADMAP, zoom: 1 }),
		markers = {},
		set_map_marker = function (user, icon) {

			var position = get_coords(user.coords),
				marker = markers[user.id] = new google_maps.Marker({
					animation: google_maps.Animation.BOUNCE,
					icon: "http://google-maps-icons.googlecode.com/files/" + (icon || "friends") + ".png",
					map: map,
					position: position
				});

			google_maps.event.addListener(marker, "click", function () {

				info.setPosition(position);
				info.setContent("That's " + user.user + " !");
				info.open(map);

			});

			window.setTimeout(function () { marker.setAnimation(null); }, 5E3);

		},
		socket = (new io.Socket(location.hostName)).on("message", function (message) {

			message = $.parseJSON(message);

			var user;

			switch (message.type) {
			case "connect": set_map_marker(message); break;
			case "disconnect":

				if (markers[message.id]) {

					markers[message.id].setMap(null);
					delete markers[message.id];

				}

				break;

			default: for (user in message) { message.hasOwnProperty(user) && set_map_marker(message[user]); }
			}

		}).connect();

	$("#submit").button().click(function () {

		var geolocation = navigator && navigator.geolocation,
			nickname = $("#nickname").val(),
			has_geolocation = function (position) {

				position.coords && (position = position.coords);

				var you = { coords: position, id: socket.transport.sessionid, type: "connect", user: nickname };

				map.setCenter(get_coords(position));
				set_map_marker(you, "home");
				$dialog.dialog("destroy").remove();
				socket.send(you);

			},
			no_geolocation = function (error) {

				has_geolocation(zero_zero);
				console && console.error(error || "Geolocation error ...");

			};

		!nickname && (nickname = "Anonymous");

		(geolocation) ?
			geolocation.getCurrentPosition(has_geolocation, no_geolocation) :
			$.getScript("http://code.google.com/apis/gears/gears_init.js").always(function () {

				(google.gears) ?
					google.gears.factory.create("beta.geolocation").getCurrentPosition(has_geolocation, no_geolocation) :
					no_geolocation();

			});

		$dialog.dialog("option", { title: "Getting your geolocation ...", closeOnEscape: !1 }).html("<p>... This may take a while.</p>").prev().find("a").remove();

		return !1;

	});

	$("body").removeClass("nojs");
	$dialog.dialog("open");

});