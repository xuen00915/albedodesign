<?php
/** Run from the extracted release: wp --path=/actual/wordpress/root eval-file import-draft.php */
if (!defined('WP_CLI') || !WP_CLI) {
    exit("This installer runs through WP-CLI only.\n");
}

$release_dir = __DIR__;
$release = json_decode(file_get_contents($release_dir . '/release.json'), true);
$template_file = $release_dir . '/albedo-landed-elementor.json';
if (!$release || hash_file('sha256', $template_file) !== $release['template_sha256']) {
    WP_CLI::error('Release metadata or template checksum is invalid.');
}
if (untrailingslashit(home_url()) !== $release['site']) {
    WP_CLI::error('Wrong WordPress site. This package targets ' . $release['site']);
}
if (!did_action('elementor/loaded') || !function_exists('wpcf7_contact_form')) {
    WP_CLI::error('Elementor and Contact Form 7 must already be active.');
}
preg_match('/id="([a-zA-Z0-9_-]+)"/', $release['form_shortcode'], $match);
$form = wpcf7_get_contact_form_by_hash($match[1]);
if (!$form && ctype_digit($match[1])) $form = wpcf7_contact_form((int) $match[1]);
if (!$form) {
    WP_CLI::error('The existing enquiry form was not found. No page was created.');
}
$field_names = array_map(static function ($tag) { return $tag->name; }, $form->scan_form_tags());
$required_names = array('your-name', 'your-phone', 'your-email', 'promo_opt_in');
$missing = array_diff($required_names, $field_names);
if ($missing) {
    WP_CLI::error('The existing form needs review before import. Missing field IDs: ' . implode(', ', $missing));
}
$draft_slug = 'landed-home-renovation-review-' . $release['version'];
if (get_page_by_path($draft_slug, OBJECT, 'page')) {
    WP_CLI::error('A review page for this release already exists. Inspect it instead of duplicating it.');
}
$uploads = wp_upload_dir();
if ($uploads['error'] || untrailingslashit($uploads['baseurl']) !== $release['site'] . '/wp-content/uploads') {
    WP_CLI::error('Uploads use a custom path or CDN. Rebuild the package for this environment before importing.');
}
$relative = 'alb-landed/' . $release['version'];
$source_dir = $release_dir . '/uploads/' . $relative;
$destination = $uploads['basedir'] . '/' . $relative;
if (!is_dir($source_dir)) WP_CLI::error('Packaged assets are missing.');
if (!wp_mkdir_p($destination)) WP_CLI::error('Cannot create the versioned asset folder.');
foreach (glob($source_dir . '/*') as $source) {
    $target = $destination . '/' . basename($source);
    if (file_exists($target) && hash_file('sha256', $source) !== hash_file('sha256', $target)) {
        WP_CLI::error('An existing asset differs: ' . basename($target) . '. Nothing was overwritten.');
    }
    if (!file_exists($target) && !copy($source, $target)) WP_CLI::error('Asset copy failed: ' . basename($source));
}
$template = json_decode(file_get_contents($template_file), true);
$new_form = $form->copy();
$new_form->set_title('Landed Home Consultation — Review ' . $release['version']);
$mail = $new_form->prop('mail');
$mail['body'] .= "\n\nSelected home type: [property_type]\nSource: [utm_source]\nMedium: [utm_medium]\nCampaign: [utm_campaign]\nTerm: [utm_term]\nGCLID: [gclid]\nLanding page: [landing_page]\n";
$new_form->set_properties(array('form' => file_get_contents($release_dir . '/cf7-form.html'), 'mail' => $mail));
$new_form_id = $new_form->save();
if (!$new_form_id) WP_CLI::error('Could not create the review form.');
$new_form = wpcf7_contact_form($new_form_id);
if (!$new_form || (int) $new_form->id() !== (int) $new_form_id) {
    WP_CLI::error('The saved review form could not be reloaded. No page was created.');
}
$replace_shortcode = static function (&$nodes) use (&$replace_shortcode, $release, $new_form) {
    foreach ($nodes as &$node) {
        if (isset($node['settings']['shortcode'])) {
            $node['settings']['shortcode'] = str_replace($release['form_shortcode'], $new_form->shortcode(), $node['settings']['shortcode']);
        }
        if (!empty($node['elements'])) $replace_shortcode($node['elements']);
    }
};
$replace_shortcode($template['content']);
$page_id = wp_insert_post(array(
    'post_type' => 'page',
    'post_status' => 'draft',
    'post_title' => 'Landed Home Renovation — Review ' . $release['version'],
    'post_name' => $draft_slug,
    'post_content' => '',
    'meta_input' => array(
        '_wp_page_template' => 'elementor_canvas',
        '_elementor_edit_mode' => 'builder',
        '_elementor_template_type' => 'wp-page',
        '_elementor_version' => ELEMENTOR_VERSION,
        '_elementor_data' => wp_slash(wp_json_encode($template['content'])),
        '_elementor_page_settings' => $template['page_settings'],
        'rank_math_robots' => array('noindex'),
        'rank_math_title' => 'Landed Home Renovation Singapore | Albedo Design',
        'rank_math_description' => 'Terrace, semi-D, bungalow and shophouse renovation by Albedo Design. Book a free consultation.',
        '_alb_release' => $release['version'],
        '_alb_review_form_id' => $new_form_id,
    ),
), true);
if (is_wp_error($page_id)) WP_CLI::error($page_id->get_error_message());
if (get_post_status($page_id) !== 'draft') WP_CLI::error('Unexpected page status. Inspect immediately.');
WP_CLI::success('Created draft page ' . $page_id . '. The published page and enquiry form were not changed.');
WP_CLI::line('Editor: ' . admin_url('post.php?post=' . $page_id . '&action=elementor'));
WP_CLI::line('Preview: ' . get_preview_post_link($page_id));
WP_CLI::line('Review form ID: ' . $new_form_id . ' (copied delivery settings; original form unchanged).');
WP_CLI::line('Complete PUBLISH.md before publishing. Mail delivery has not been tested.');
