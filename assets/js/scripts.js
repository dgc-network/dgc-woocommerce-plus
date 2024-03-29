jQuery(document).ready(function($) {
	// return false if dgc_params variable is not found
	if (typeof dgc_params === 'undefined') {
		return false;
	}

	// store widget ids those will be replaced with new data
	var widgets = {};

	$('.dgc-ajax-filter').each(function(index) {
		var widget_id = $(this).attr('id');
		widgets[index] = widget_id;
	});

	// scripts to run before updating shop loop
	dgcBeforeUpdate = function() {
		var overlay_color;

		if (dgc_params.overlay_bg_color.length) {
			overlay_color = dgc_params.overlay_bg_color;
		} else {
			overlay_color = '#fff';
		}

		var markup = '<div class="dgc-before-update" style="background-color: ' + overlay_color + '"></div>',
			holder,
			top_scroll_offset = 0;

		if ($(dgc_params.shop_loop_container.length)) {
			holder = dgc_params.shop_loop_container;
		} else if ($(dgc_params.not_found_container).length) {
			holder = dgc_params.not_found_container;
		}

		if (holder.length) {
			// show loading image
			$(markup).prependTo(holder);

			// scroll to top
			if (typeof dgc_params.scroll_to_top !== 'undefined' && dgc_params.scroll_to_top == true && window.matchMedia("(min-width: 768px)").matches) {
				var scroll_to_top_offset,
					top_scroll_offset;

				if (typeof dgc_params.scroll_to_top_offset !== 'undefined' && dgc_params.scroll_to_top_offset.length) {
					scroll_to_top_offset = parseInt(dgc_params.scroll_to_top_offset);
				} else {
					scroll_to_top_offset = 100;
				}

				top_scroll_offset = $(holder).offset().top - scroll_to_top_offset;

				if (top_scroll_offset < 0) {
					top_scroll_offset = 0;
				}

				$('html, body').animate({scrollTop: top_scroll_offset}, 'slow');
			}
		}

	}

	// scripts to run after updating shop loop
	dgcBeforeUpdate = function() {}

	// load filtered products
	dgcFilterProducts = function() {
		// run before update function: show a loading image and scroll to top
		dgcBeforeUpdate();

		$.get(window.location.href, function(data) {
			var $data = jQuery(data),
				shop_loop = $data.find(dgc_params.shop_loop_container),
				not_found = $data.find(dgc_params.not_found_container);

			// replace widgets data with new data
			$.each(widgets, function(index, id) {
				var single_widget = $data.find('#' + id),
					single_widget_class = $(single_widget).attr('class'),
					current_widget = $('#' + id);

				// update class
				current_widget.attr('class', single_widget_class);
				// update widget
				current_widget.html(single_widget.html());
				$(document).trigger('wcapf:widget_update', current_widget);
			});

			// replace old shop loop with new one
			if (dgc_params.shop_loop_container == dgc_params.not_found_container) {
				$(dgc_params.shop_loop_container).html(shop_loop.html());
			} else {
				if ($(dgc_params.not_found_container).length) {
					if (shop_loop.length) {
						$(dgc_params.not_found_container).html(shop_loop.html());
					} else if (not_found.length) {
						$(dgc_params.not_found_container).html(not_found.html());
					}
				} else if ($(dgc_params.shop_loop_container).length) {
					if (shop_loop.length) {
						$(dgc_params.shop_loop_container).html(shop_loop.html());
					} else if (not_found.length) {
						$(dgc_params.shop_loop_container).html(not_found.html());
					}
				}
			}

			// reinitialize ordering
			dgcInitOrder();

      // reinitialize dropdown filter
      dgcDropDownFilter();

      // reinitialize range filter
      dgcRangeFilter();

			// run scripts after shop loop undated
			if (typeof dgc_params.custom_scripts !== 'undefined' && dgc_params.custom_scripts.length > 0) {
				eval(dgc_params.custom_scripts);
			}
		});
	}

	// URL Parser
	dgcGetUrlVars = function(url) {
	    var vars = {}, hash;

	    if (typeof url == 'undefined') {
	    	url = window.location.href;
	    } else {
	    	url = url;
	    }

	    var hashes = url.slice(url.indexOf('?') + 1).split('&');
	    for (var i = 0; i < hashes.length; i++) {
	        hash = hashes[i].split('=');
	        vars[hash[0]] = hash[1];
	    }
	    return vars;
	}

	// if current page is greater than 1 then we should set it to 1
	// everytime we add new query to url to prevent page not found error.
	dgcFixPagination = function() {
		var url = window.location.href,
			params = dgcGetUrlVars(url);

		if (current_page = parseInt(url.replace(/.+\/page\/([0-9]+)+/, "$1"))) {
			if (current_page > 1) {
				url = url.replace(/page\/([0-9]+)/, 'page/1');
			}
		}
		else if(typeof params['paged'] != 'undefined') {
			current_page = parseInt(params['paged']);
			if (current_page > 1) {
				url = url.replace('paged=' + current_page, 'paged=1');
			}
		}

		return url;
	}

	// update query string for categories, meta etc..
	dgcUpdateQueryStringParameter = function(key, value, push_history, url) {
		if (typeof push_history === 'undefined') {
			push_history = true;
		}

		if (typeof url === 'undefined') {
			url = dgcFixPagination();
		}

		var re = new RegExp("([?&])" + key + "=.*?(&|$)", "i"),
			separator = url.indexOf('?') !== -1 ? "&" : "?",
			url_with_query;

		if (url.match(re)) {
			url_with_query = url.replace(re, '$1' + key + "=" + value + '$2');
		}
		else {
			url_with_query = url + separator + key + "=" + value;
		}

		if (push_history === true) {
			return history.pushState({}, '', url_with_query);
		} else {
			return url_with_query;
		}
	}

	// remove parameter from url
	dgcRemoveQueryStringParameter = function(filter_key, url) {
		if (typeof url === 'undefined') {
			url = dgcFixPagination();
		}

		var params = dgcGetUrlVars(url),
			count_params = Object.keys(params).length,
			start_position = url.indexOf('?'),
			param_position = url.indexOf(filter_key),
			clean_url,
			clean_query;

		if (count_params > 1) {
			if ((param_position - start_position) > 1) {
				clean_url = url.replace('&' + filter_key + '=' + params[filter_key], '');
			} else {
				clean_url = url.replace(filter_key + '=' + params[filter_key] + '&', '');
			}

			var params = clean_url.split('?');
			clean_query = '?' + params[1];
		} else {
			clean_query = url.replace('?' + filter_key + '=' + params[filter_key], '');
		}

		return clean_query;
	}

	// add filter if not exists else remove filter
	dgcSingleFilter = function(filter_key, filter_val) {
		var params = dgcGetUrlVars(),
			query;

		if (typeof params[filter_key] !== 'undefined' && params[filter_key] == filter_val) {
			query = dgcRemoveQueryStringParameter(filter_key);
		} else {
			query = dgcUpdateQueryStringParameter(filter_key, filter_val, false);
		}

		// update url
		history.pushState({}, '', query);

		// filter products
		dgcFilterProducts();
	}

	// take the key and value and make query
	dgcMakeParameters = function(filter_key, filter_val, url) {
		var params,
			next_vals,
			empty_val = false;

		if (typeof url !== 'undefined') {
			params = dgcGetUrlVars(url);
		} else {
			params = dgcGetUrlVars();
		}

		if (typeof params[filter_key] != 'undefined') {
			var prev_vals = params[filter_key],
				prev_vals_array = prev_vals.split(',');

			if (prev_vals.length > 0) {
				var found = jQuery.inArray(filter_val, prev_vals_array);

				if (found >= 0) {
				    // Element was found, remove it.
				    prev_vals_array.splice(found, 1);

				    if (prev_vals_array.length == 0) {
				    	empty_val = true;
				    }
				} else {
				    // Element was not found, add it.
				    prev_vals_array.push(filter_val);
				}

				if (prev_vals_array.length > 1) {
					next_vals = prev_vals_array.join(',');
				} else {
					next_vals = prev_vals_array;
				}
			} else {
				next_vals = filter_val;
			}
		} else {
			next_vals = filter_val;
		}

		// update url and query string
		if (empty_val == false) {
			dgcUpdateQueryStringParameter(filter_key, next_vals);
		} else {
			var query = dgcRemoveQueryStringParameter(filter_key);
			history.pushState({}, '', query);
		}

		// filter products
		dgcFilterProducts();
	}

	// handle the filter request
	$('.dgc-ajax-filter_list').not('.dgc-ajax-filter_price').on('click', 'li a', function(event) {
		event.preventDefault();
		var element = $(this),
			filter_key = element.attr('data-key'),
			filter_val = element.attr('data-value'),
			enable_multiple_filter = element.attr('data-multiple-filter');

		if (enable_multiple_filter == true) {
			dgcMakeParameters(filter_key, filter_val);
		} else {
			dgcSingleFilter(filter_key, filter_val);
		}

	});

	// handle the filter request for price filter display type list
	$('.dgc-ajax-filter_price.dgc-ajax-filter_list').on('click', 'li a', function(event) {
		event.preventDefault();
		var element = $(this),
			filter_key_min = element.attr('data-key-min'),
			filter_val_min = element.attr('data-value-min'),
			filter_key_max = element.attr('data-key-max'),
			filter_val_max = element.attr('data-value-max'),
			query;

		if (element.parent().hasClass('chosen')) {
			query = dgcRemoveQueryStringParameter(filter_key_min);
			query = dgcRemoveQueryStringParameter(filter_key_max, query);

			if (query == '') {
				query = window.location.href.split('?')[0];
			}

			history.pushState({}, '', query);
		} else {
			query = dgcUpdateQueryStringParameter(filter_key_min, filter_val_min, false);
			query = dgcUpdateQueryStringParameter(filter_key_max, filter_val_max, true, query);
		}

		// filter products
		dgcFilterProducts();
	});

	// handle the pagination request
	if (dgc_params.pagination_container.length > 0) {
		var holder = dgc_params.pagination_container + ' a';

		$(document).on('click', holder, function(event) {
			event.preventDefault();
			var location = $(this).attr('href');
			history.pushState({}, '', location);

			// filter products
			dgcFilterProducts();
		});
	}

	// history back and forward request handling
	$(window).bind('popstate', function(event) {
		// filter products
		dgcFilterProducts();
    });

    // ordering
    dgcInitOrder = function() {
    	if (typeof dgc_params.sorting_control !== 'undefined' && dgc_params.sorting_control.length && dgc_params.sorting_control == true) {
	    	$('.dgc-before-products').find('.woocommerce-ordering').each(function(index) {
	    		$(this).on('submit', function(event) {
	    			event.preventDefault();
	    		});

	    		$(this).on('change', 'select.orderby', function(event) {
	    			event.preventDefault();

	    			var order = $(this).val(),
	    				filter_key = 'orderby';

	    			// change url
	    			dgcUpdateQueryStringParameter(filter_key, order);

	    			// filter products
	    			dgcFilterProducts();
	    		});
	    	});
    	}
    }

    // init ordering
    dgcInitOrder();

    // remove active filters
    $(document).on('click', '.dgc-active-filters a:not(.reset)', function(event) {
    	event.preventDefault();
    	var element = $(this),
    		filter_key = element.attr('data-key'),
    		filter_val = element.attr('data-value');

    	if (typeof filter_val === 'undefined') {
	    	var query = dgcRemoveQueryStringParameter(filter_key);
	    	history.pushState({}, '', query);

	    	// price slider
        var priceSlider = $('#dgc-noui-slider')
	    	if (priceSlider.length && jQuery().ionRangeSlider) {
          var ionRangeSlider = priceSlider.data("ionRangeSlider");
					if (filter_key === 'min-price') {
						ionRangeSlider.update({
							from: ionRangeSlider.result.min
						});
					} else if (filter_key === 'max-price') {
						ionRangeSlider.update({
							to: ionRangeSlider.result.max
						});
					}
	    	}

	    	// filter products
	    	dgcFilterProducts();
    	} else {
    		dgcMakeParameters(filter_key, filter_val);
    	}
    });

    // clear all filters
    $(document).on('click', '.dgc-active-filters a.reset', function(event) {
    	event.preventDefault();
    	var location = $(this).attr('data-location');
    	history.pushState({}, '', location);

    	// filter products
    	dgcFilterProducts();
    });

	// dispaly type dropdown
	function formatState(state) {
	    var depth = $(state.element).attr('data-depth'),
	    	$state = $('<span class="depth depth-' + depth + '">' + state.text + '</span>');

		return $state;
	}

	dgcDropDownFilter = function() {
		if ($('.dgc-select2-single').length) {
			$('.dgc-select2-single').select2({
			    templateResult: formatState,
			    minimumResultsForSearch: Infinity,
			    allowClear: true
			});
		}

		if ($('.dgc-select2-multiple').length) {
			$('.dgc-select2-multiple').select2({
			    templateResult: formatState,
			});
		}

		$('.select2-dropdown').css('display', 'none');
	}

	// initialize dropdown filter
	dgcDropDownFilter();

	$(document).on('change', '.dgc-select2', function(event) {
		event.preventDefault();
		var filter_key = $(this).attr('name'),
			filter_val = $(this).val();

		if (!filter_val) {
			var query = dgcRemoveQueryStringParameter(filter_key);
			history.pushState({}, '', query);
		} else {
			filter_val = filter_val.toString();
			dgcUpdateQueryStringParameter(filter_key, filter_val);
		}

		// filter products
		dgcFilterProducts();
	});

  dgcRangeFilter = function() {
    var params = dgcGetUrlVars();

    $('.dgc-range-terms').each(function () {
    	var initialValues = $(this).data('initial-values');
      var filter_key = $(this).attr('name');
      var values = [];
      var ids = [];

      $.each(initialValues, function (key, value) {
        ids.push(key);
        values.push(value);
      });

      var args = {
        type: "double",
        values: values,
        grid: true,
        onFinish: function (data) {
          if (data.from === 0 && data.to === values.length - 1) {
            history.pushState({}, '', dgcRemoveQueryStringParameter(filter_key));
          } else {
            dgcUpdateQueryStringParameter(filter_key, ids.slice(data.from, data.to + 1).join(','));
          }

          // filter products
          dgcFilterProducts();
        }
      };

      if (params[filter_key]) {
        var filter_current = params[filter_key].split(',');

        args.from = ids.indexOf(filter_current[0]);
        args.to = ids.indexOf(filter_current[filter_current.length-1]);
			}

      $(this).ionRangeSlider(args);
    });
  }

  // initialize dropdown filter
  dgcRangeFilter();
});