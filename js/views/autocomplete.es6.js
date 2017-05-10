const Parent = window.DDG.base.View;

function Autocomplete (ops) {

    this.model = ops.model;
    this.pageView = ops.pageView;
    this.template = ops.template;

    Parent.call(this, ops);

    this.bindEvents([
      [this.model.store.subscribe, 'change:search', this._handleUpdate]
    ]);


};

Autocomplete.prototype = $.extend({},
    Parent.prototype,
    {

        _handleUpdate: function (update) {
            console.log('[AutocompleteView] _handleUpdate(update):');
            console.log(update);

            if (update.change && update.change.attribute === 'searchText') {
                this.model.fetchSuggestions(update.change.value)
                  .then(() => this._rerender());
            }
        },

    }

);

module.exports = Autocomplete;
