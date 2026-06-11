/**
 * SaintapediaSort — JavaScript module
 *
 * 1. Wraps .drilldown-filters-wrapper + .drilldown-results in a flex
 *    container so the sidebar layout works regardless of which skin or
 *    DOM parent Cargo places them in. If they do not share a parent the
 *    layout step is skipped gracefully; chip and toggle features still render.
 * 2. Renders active-filter "chips" above the results for quick removal.
 *    URLs are built with mw.util.getUrl() so both short-URL and
 *    index.php?title= wikis work correctly.
 * 3. Adds a mobile toggle button that shows/hides the filter sidebar.
 *    Toggle state is persisted in localStorage only on explicit user action.
 * 4. Uses matchMedia to drive mobile layout from cfg.mobileBreak — JS is
 *    the single source of truth; there is no CSS @media fallback.
 */
( function () {
	'use strict';

	var cfg = {
		sidebarWidth:  mw.config.get( 'saintapediaSortSidebarWidth',    280 ),
		showChips:     mw.config.get( 'saintapediaSortShowFilterChips',  true ),
		stickyFilters: mw.config.get( 'saintapediaSortStickyFilters',    true ),
		mobileBreak:   mw.config.get( 'saintapediaSortMobileBreakpoint', 720 )
	};

	var STORAGE_KEY = 'saintapedia-sort-filters-open';

	/* -- URL / filter helpers ------------------------------------------ */

	function isInternalParam( key ) {
		return key.charAt( 0 ) === '_' || key === 'title' || key === 'action';
	}

	function getActiveFilters() {
		var params  = new URLSearchParams( window.location.search );
		var filters = [];
		params.forEach( function ( val, key ) {
			if ( isInternalParam( key ) ) { return; }
			var label = key
				.replace( /\[([^\]]+)\]$/, ' ($1)' )
				.replace( /_/g, ' ' );
			filters.push( { key: key, label: label, value: val } );
		} );
		return filters;
	}

	function urlParamsToObj( params ) {
		var obj = {};
		params.forEach( function ( v, k ) {
			if ( k === 'title' || k === 'action' ) { return; }
			if ( Object.prototype.hasOwnProperty.call( obj, k ) ) {
				obj[ k ] = [].concat( obj[ k ], v );
			} else {
				obj[ k ] = v;
			}
		} );
		return obj;
	}

	function buildRemoveUrl( key, value ) {
		var params = new URLSearchParams( window.location.search );
		var kept   = params.getAll( key ).filter( function ( v ) { return v !== value; } );
		params.delete( key );
		kept.forEach( function ( v ) { params.append( key, v ); } );
		return mw.util.getUrl( mw.config.get( 'wgPageName' ), urlParamsToObj( params ) );
	}

	function buildClearUrl() {
		var kept   = {};
		var params = new URLSearchParams( window.location.search );
		params.forEach( function ( v, k ) {
			if ( k.charAt( 0 ) === '_' ) { kept[ k ] = v; }
		} );
		return mw.util.getUrl( mw.config.get( 'wgPageName' ), kept );
	}

	/* -- DOM helper ---------------------------------------------------- */

	function el( tag, cls, text ) {
		var node = document.createElement( tag );
		if ( cls )  { node.className = cls; }
		if ( text ) { node.textContent = text; }
		return node;
	}

	/* -- Feature: flex layout wrapper ---------------------------------- */

	function applyFlexLayout( filtersEl, resultsEl ) {
		var parent = filtersEl.parentElement;
		if ( resultsEl.parentElement !== parent ) {
			mw.log.warn( 'SaintapediaSort: filters and results do not share a parent; sidebar layout skipped.' );
			return null;
		}
		var wrapper = el( 'div', 'cargo-drilldown-layout' );
		parent.insertBefore( wrapper, filtersEl );
		wrapper.appendChild( filtersEl );
		wrapper.appendChild( resultsEl );
		return wrapper;
	}

	/* -- Feature: active-filter chips ---------------------------------- */

	function renderFilterChips( resultsEl ) {
		var filters = getActiveFilters();
		if ( !filters.length ) { return; }

		var bar = el( 'div', 'cargo-active-filters' );
		bar.setAttribute( 'role', 'region' );
		bar.setAttribute( 'aria-label', mw.msg( 'saintapediasort-active-filters' ) );

		filters.forEach( function ( f ) {
			var chip   = el( 'span', 'cargo-filter-chip' );
			var label  = el( 'span', 'cargo-chip-label', f.label + ': ' + f.value );
			var remove = el( 'a', 'cargo-chip-remove', '×' );
			remove.href  = buildRemoveUrl( f.key, f.value );
			remove.title = mw.msg( 'saintapediasort-remove-filter' );
			remove.setAttribute( 'aria-label',
				mw.msg( 'saintapediasort-remove-filter' ) + ': ' + f.label + ' = ' + f.value );
			chip.appendChild( label );
			chip.appendChild( remove );
			bar.appendChild( chip );
		} );

		if ( filters.length > 1 ) {
			var clearWrap = el( 'span', 'cargo-clear-all' );
			var clearLink = el( 'a', '', mw.msg( 'saintapediasort-clear-filters' ) );
			clearLink.href = buildClearUrl();
			clearWrap.appendChild( clearLink );
			bar.appendChild( clearWrap );
		}

		resultsEl.insertBefore( bar, resultsEl.firstChild );
	}

	/* -- Feature: mobile toggle ---------------------------------------- */

	/**
	 * Creates the Show/Hide filters button. Returns { setOpen } so the
	 * breakpoint watcher can update visual state without touching localStorage.
	 *
	 * setOpen( open )        — updates state and persists to localStorage.
	 * setOpen( open, false ) — updates visual state only; used by the
	 *                          breakpoint watcher so it never overwrites the
	 *                          user's last explicit choice.
	 */
	function addMobileToggle( filtersEl ) {
		var btn    = el( 'button', 'cargo-filters-toggle' );
		var isOpen = false;

		function setOpen( open, persist ) {
			isOpen = open;
			btn.textContent = isOpen
				? mw.msg( 'saintapediasort-hide-filters' )
				: mw.msg( 'saintapediasort-show-filters' );
			btn.setAttribute( 'aria-expanded', isOpen ? 'true' : 'false' );
			filtersEl.classList.toggle( 'cargo-filters-collapsed', !isOpen );
			if ( persist !== false ) {
				try { localStorage.setItem( STORAGE_KEY, isOpen ? '1' : '0' ); } catch ( ex ) {}
			}
		}

		if ( !filtersEl.id ) { filtersEl.id = 'cargo-filter-sidebar'; }
		btn.setAttribute( 'aria-controls', filtersEl.id );

		var stored;
		try { stored = localStorage.getItem( STORAGE_KEY ); } catch ( ex ) {}
		setOpen( stored === '1' );

		btn.addEventListener( 'click', function () { setOpen( !isOpen ); } );
		filtersEl.parentElement.insertBefore( btn, filtersEl );

		return { setOpen: setOpen };
	}

	/* -- Feature: config-driven mobile breakpoint ---------------------- */

	/**
	 * JS is the single source of truth for the layout breakpoint.
	 * All mobile rules key off .cargo-mobile-layout toggled here.
	 * The breakpoint watcher never writes to localStorage — it calls
	 * setOpen( open, false ) so the user's stored preference is preserved.
	 */
	function initBreakpointWatcher( layoutEl, filtersEl, toggle ) {
		var mq = window.matchMedia( '(max-width: ' + ( cfg.mobileBreak - 1 ) + 'px)' );

		function onBreakpoint( e ) {
			layoutEl.classList.toggle( 'cargo-mobile-layout', e.matches );
			if ( !e.matches ) {
				// Desktop: always show the sidebar; do not overwrite stored preference
				toggle.setOpen( true, false );
			} else {
				// Mobile: restore the user's last explicit choice
				var mobileStored;
				try { mobileStored = localStorage.getItem( STORAGE_KEY ); } catch ( ex ) {}
				toggle.setOpen( mobileStored === '1', false );
			}
		}

		// Support both modern addEventListener and legacy addListener (Safari < 14)
		if ( mq.addEventListener ) {
			mq.addEventListener( 'change', onBreakpoint );
		} else {
			mq.addListener( onBreakpoint );
		}
		onBreakpoint( mq );
	}

	/* -- Main init ----------------------------------------------------- */

	function init() {
		var filtersEl = document.querySelector( '.drilldown-filters-wrapper' );
		var resultsEl = document.querySelector( '.drilldown-results' );
		if ( !filtersEl || !resultsEl ) {
			mw.log.warn( 'SaintapediaSort: Cargo selectors not found (' +
				( filtersEl ? '' : '.drilldown-filters-wrapper ' ) +
				( resultsEl ? '' : '.drilldown-results' ) + 'missing).' );
			return;
		}
		if ( filtersEl.dataset.saintapediasortInit ) { return; }
		filtersEl.dataset.saintapediasortInit = '1';

		var layoutEl = applyFlexLayout( filtersEl, resultsEl );
		if ( layoutEl ) {
			layoutEl.style.setProperty( '--cargo-sidebar-width', cfg.sidebarWidth + 'px' );
		}

		if ( cfg.stickyFilters ) { filtersEl.classList.add( 'cargo-filters-sticky' ); }
		if ( cfg.showChips )     { renderFilterChips( resultsEl ); }

		var toggle = addMobileToggle( filtersEl );
		if ( layoutEl ) {
			initBreakpointWatcher( layoutEl, filtersEl, toggle );
		}
	}

	mw.hook( 'wikipage.content' ).add( function () {
		init();
	} );

}() );
