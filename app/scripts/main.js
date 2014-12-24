var App;

// Album Model
// ----------

var Album = Backbone.Model.extend({

    defaults: function() {
        return {};
    },

});

// Album Collection
// ---------------

var AlbumList = Backbone.Collection.extend({

    model: Album,

    // localStorage: new Backbone.LocalStorage("Albums"),

    sortKey: 'colorsum', // 'hue'

    comparator: function(a, b) {
        a = a.get(this.sortKey);
        b = b.get(this.sortKey);
        return a > b;
    },

    fetchMethod: 'getFavorites', // 'getAlbumsInCollection',

    fetch: function() {

        var that = this;

        R.request({
            method: that.fetchMethod,
            content: {
                types: "tracksAndAlbums",
                extras: 'dominantColor,icon400'
            },
            success: function(response) {
                // First we add color data.
                var results = that.addColorData(response.result, that);
                that.reset(results);
            },
            error: function(response) {
                console.log("error: " + response.message);
            }
        });

    },

    addColorData: function(data) {

        var that = this;

        _.each(data, function(obj) {
            obj.hsl = that.rgbToHsl(obj.dominantColor);
            obj.hue = obj.hsl.h;
            obj.colorsum = (0.21 * obj.dominantColor.r) + (0.72 * obj.dominantColor.g) + (0.07 * obj.dominantColor.b);
        });

        return data;
    },

    rgbToHsl: function(c) {
        var color = tinycolor(c);
        return color.toHsl();
    }

});

var Albums = new AlbumList;

// Album Item View
// --------------

var AlbumView = Backbone.View.extend({

    tag: 'div',
    className: 'album',

    template: Handlebars.compile($("#album-template").html()),

    events: {
        'click': 'albumClick'
    },

    initialize: function() {

    },

    render: function() {

        var that = this;

        this.$el.html(this.template(this.model.toJSON()));

        this.$el.css({
            'background-color': this.parseColor(this.model.get('dominantColor'))
        });

        this.$el.find('img').on('load', function() {
            that.$el.addClass('album--loaded');
        });

        return this;
    },

    parseColor: function(obj) {
        return 'rgb(' + obj.r + ',' + obj.g + ',' + obj.b + ')';
    },

    albumClick: function() {

        var $album = this.$el;

        if ($album.hasClass('album--loaded')) {
            $album.removeClass('album--loaded');
        } else {
            $album.addClass('album--loaded');
        }

    }

});

// The Application
// ---------------

var AppView = Backbone.View.extend({

    el: $("#app"),

    tag: 'div',

    template: Handlebars.compile($("#stage-template").html()),

    events: {
        'click .js-load-collection': 'loadCollection',
        'click .js-load-favorites': 'loadFavorites',
        'click .js-toggle-covers': 'toggleCovers'
    },

    initialize: function() {
        this.listenTo(Albums, 'reset', this.addAll);
        // this.listenTo(Albums, 'all', this.render);

        this.render();
        this.$grid = this.$el.find('.album-grid');
        this.$grid.hide();

        Albums.fetch();
    },

    render: function() {
        this.$el.html(this.template({}));
        return this;
    },

    addOne: function(album) {
        var view = new AlbumView({
            model: album
        });

        this.$grid.append(view.render().el);
    },

    addAll: function() {
        Albums.each(this.addOne, this);
        this.$grid.fadeIn(500);
    },

    loadCollection: function(e) {

        if(!$(e.currentTarget).hasClass('active')) {
        	this.$grid.fadeOut(300);
        	$(e.currentTarget).addClass('active').siblings().removeClass('active');
        	Albums.fetchMethod = 'getAlbumsInCollection';
        	Albums.fetch();
        }
    },

    loadFavorites: function(e) {

    	if(!$(e.currentTarget).hasClass('active')) {
        	this.$grid.fadeOut(300);
        	$(e.currentTarget).addClass('active').siblings().removeClass('active');
        	Albums.fetchMethod = 'getFavorites';
        	Albums.fetch();
        }
    },

    toggleCovers: function(e) {

    	var $btn = $(e.currentTarget);

    	if($btn.data('state') === 'show') {
    		$btn.data('state', 'hide');
    		$btn.addClass('active');
    		$btn.text('Show Covers');
    		this.$grid.find('.album').removeClass('album--loaded');
    	} else {
    		$btn.data('state', 'show');
    		$btn.removeClass('active');
    		$btn.text('Hide Covers');
    		this.$grid.find('.album').addClass('album--loaded');
    	}

    }

});



// ----------
R.ready(function() {

    $('.signin').click(function() {
        R.authenticate(function(nowAuthenticated) {

            if (nowAuthenticated) {
                App = new AppView;
            }

        });
    });

    // Kick it off if user is already logged in.
    if (R.authenticated()) {
        App = new AppView;
    }

});
