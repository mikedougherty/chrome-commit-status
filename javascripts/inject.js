$(function() {
    // Attempt to detect github, bail if not found
    var github = $('head');
    github = github ? github.attr('prefix') : false;
    github = github ? github.match(/githubog:/) : false;
    if (!github) {
        return;
    }

    var Project = function(options) {
        _.defaults(this, options, {
            domain: this.pageDomain(),
            owner: this.pageOwner(),
            name: this.pageProject()
        });

        this._pending = {};
        this.initStorage();
    };

    _.extend(Project.prototype, {
        initStorage: function () {
            this._data = localStorage[this.toString()];
            if (!this._data) {
                this._data = localStorage[this.toString()] = {};
            }
        },

        apiBase: function() {
            var uri = new URI();
            uri.protocol('https');
            if (this.domain == 'github.com') {
                uri.host('api.github.com');
                uri.pathname('/');
            } else {
                // Enterprise
                uri.host(this.domain);
                uri.pathname('/api/v3/');
            }
            return uri.pathname(uri.pathname() + _.string.sprintf('repos/%s/%s', this.owner, this.name));
        },

        apiUrl: function() {
            var uri = this.apiBase();
            for (var i in arguments) {
                var arg = arguments[i];
                uri.pathname(uri.pathname() + '/' + arg);
            }
            return uri.toString();
        },

        getStatus: function(sha) {
            var status = this._data[sha];
            if (!status) {
                status = 'unknown';
                this.setStatus(status);
            }
            this.updateStatus(sha);

            return status;
        },

        setStatus: function(sha, status) {
            status = status || 'unknown';
            this._data[sha] = status;
            // TODO: get the DOM manipulation out of the model
            $('[data-commit-id="' + sha + '"]').attr('data-commit-status', status);
            return this._data[sha];
        },

        updateStatus: function (sha) {
            var self = this;
            if (self._pending[sha]) {
                return self._pending[sha];
            }
            self._pending[sha] = $.ajax(self.apiUrl('statuses', sha)).then(function(data) {
                if (data.length === 0) {
                    return;
                }

                self.setStatus(sha, data[0].state);
            }).always(function() {
                delete self._pending[sha];
            });

            return self._pending[sha];
        },

        toString: function() {
            return _.string.sprintf("GitHub Project: https://%s/%s/%s", this.domain, this.owner, this.name);
        },

        pageDomain: function() {
            return document.location.host;
        },

        pageProject: function() {
            var match = /^\/(?:.+?)\/(.+?)(?:\/.*)*$/.exec(URI(document.location).pathname());
            if (match !== null) {
                return match[1];
            }
            return null;
        },

        pageOwner: function() {
            var match = /^\/(.+?)(?:\/.*)*$/.exec(URI(document.location).pathname());
            if (match !== null) {
                return match[1];
            }
            return null;
        }
    });

    var thisProject = new Project();

    // Whenever a data-commit-id node changes, set its data-commit-status to whatever
    // the latest is that we have.
    $('*[data-commit-id]').live('DOMSubtreeModified', {project: thisProject}, function (evt) {
        var el = $(evt.srcElement);

        if (!el.attr('data-commit-status')) {
            el.attr('data-commit-status', evt.data.project.getStatus(el.attr('data-commit-id')));
        }
    });

    var link_selector = 'a.sha-block, a.sha, .commit-links a.gobutton, .commit-meta a';
    var link_handler = function (evt) {
        var el = $(evt.srcElement);
        var href = el.attr('href');
        var match = /([0-9a-f]{40})/.exec(href);
        if (match !== null) {
            var sha = $(el).children('.sha');
            if (sha.length === 0) {
                sha = $(el, '.sha');
            }
            sha.attr('data-commit-id', match[1]);
        }
    };

    var sha_block_selector = '.sha-block .sha';
    var sha_block_handler = function (evt) {
        var el = $(evt.srcElement);
        var text = el.text();
        var match = /([0-9a-f]{40})/.exec(text);
        if (match !== null) {
            el.attr('data-commit-id', match[1]);
        }
    };

    // Whenever the page updates, we want to search again for any shas to highlight.
    $(document).on('pageUpdate', function () {
        $.map($(link_selector), function(el) { link_handler({srcElement: el}); } );
        $.map($(sha_block_selector), function(el) { sha_block_handler({srcElement: el}); } );
    });

    // Now trigger a pageUpdate for the initial page load...
    $(document).on('ready', function() {
        $(document).trigger('pageUpdate');
    });
    // ...and a pageUpdate for each pjax load
    $(document).on("DOMSubtreeModified", function () {
        $(document).trigger('pageUpdate');
    });
});
