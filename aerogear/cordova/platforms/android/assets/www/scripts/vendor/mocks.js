var items = [{"created_at":"2013-04-12T00:30:35Z","description":"Slightly-used guitar pick.","duration":4,"ended_at":null,"id":1,"started_at":null,"starting_price":2,"title":"Jimi Hendrix Guitar Pick","updated_at":"2013-04-12T13:21:31Z","state":"pending"},{"created_at":"2013-04-12T00:30:35Z","description":"Proof of the death of Paul","duration":4,"ended_at":null,"id":2,"started_at":"2013-04-12T13:21:47Z","starting_price":15,"title":"Paul McCartney's Death Certificate","updated_at":"2013-04-12T13:21:47Z","state":"inprogress"},{"created_at":"2013-04-12T00:30:35Z","description":"Bottle of Dylan's talent","duration":4,"ended_at":null,"id":3,"started_at":null,"starting_price":20,"title":"Part of Bob Dylan's Talent","updated_at":"2013-04-12T13:21:26Z","state":"pending"},{"created_at":"2013-04-12T00:30:35Z","description":"Bonafide bit of Slash's hair","duration":4,"ended_at":null,"id":4,"started_at":null,"starting_price":15,"title":"Slash's Wig","updated_at":"2013-04-12T13:21:23Z","state":"pending"}];

var categories = [
    {
        "id": "0",
        "name": "Modern Pop"
    },
    {
        "id": "1",
        "name": "Rock"
    },
    {
        "id": "2",
        "name": "80's Rock"
    },
    {
        "id": "3",
        "name": "Hip Hop"
    },
    {
        "id": "4",
        "name": "Dub Step"
    },
    {
        "id": "5",
        "name": "Country"
    },
    {
        "id": "6",
        "name": "Folk"
    },
    {
        "id": "7",
        "name": "Jam Bands"
    }
];

/*$.mockjax({
    url: /^\/auctions\/([\d\-]+)$/,
    urlParams: [ "itemId" ],
    contentType: "text/json",
    response: function( settings ) {
        this.responseText = items[ settings.urlParams.itemId ];
    }
});


$.mockjax({
    url: "/auctions",
    contentType: "text/json",
    responseText: items
});*/

$.mockjax({
    url: "/categories",
    contentType: "text/json",
    responseText: categories
});


