<?php
/**
 * SaintapediaSort – Hooks.php
 *
 * Loads the UI-improvement ResourceLoader module on Special:Drilldown
 * (and all sub-pages like Special:Drilldown/Saints).
 */

declare( strict_types = 1 );

namespace MediaWiki\Extension\SaintapediaSort;

use MediaWiki\Config\Config;
use MediaWiki\Hook\BeforePageDisplayHook;

class Hooks implements BeforePageDisplayHook {

	private Config $config;

	public function __construct( Config $config ) {
		$this->config = $config;
	}

	/**
	 * @param \OutputPage $out
	 * @param \Skin $skin
	 */
	public function onBeforePageDisplay( $out, $skin ): void {
		if ( !$this->config->get( 'SaintapediaSortSidebarEnabled' ) ) {
			return;
		}

		$title = $out->getTitle();
		if ( $title === null || !$title->isSpecial( 'Drilldown' ) ) {
			return;
		}

		$out->addJsConfigVars( [
			'saintapediaSortSidebarWidth'     => (int)$this->config->get( 'SaintapediaSortSidebarWidth' ),
			'saintapediaSortShowFilterChips'  => (bool)$this->config->get( 'SaintapediaSortShowFilterChips' ),
			'saintapediaSortStickyFilters'    => (bool)$this->config->get( 'SaintapediaSortStickyFilters' ),
			'saintapediaSortMobileBreakpoint' => (int)$this->config->get( 'SaintapediaSortMobileBreakpoint' ),
		] );

		$out->addModules( 'ext.SaintapediaSort' );
	}
}
