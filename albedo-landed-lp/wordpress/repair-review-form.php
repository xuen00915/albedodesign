<?php
/** One-off repair of the existing Albedo review draft. Run with WP-CLI eval-file. */
if (!defined('WP_CLI') || !WP_CLI) exit("WP-CLI only.\n");
if (untrailingslashit(home_url()) !== 'https://albedodesign.com.sg'
    || get_post_status(10993) !== 'draft'
    || (int) get_post_meta(10993, '_alb_review_form_id', true) !== 10992) {
    WP_CLI::error('Site or draft ownership check failed. Nothing changed.');
}
if (!function_exists('wpcf7_contact_form')) WP_CLI::error('Contact Form 7 is inactive.');
$form = wpcf7_contact_form(10992);
if (!$form || (int) $form->id() !== 10992) WP_CLI::error('The copied form is missing.');
$before = get_post_meta(10993, '_elementor_data', true);
$nodes = json_decode($before, true);
if (!is_array($nodes)) WP_CLI::error('Invalid Elementor data.');
$count = 0;
$repair = static function (&$items) use (&$repair, &$count, $form) {
    foreach ($items as &$item) {
        if (($item['widgetType'] ?? '') === 'shortcode'
            && isset($item['settings']['shortcode'])
            && strpos($item['settings']['shortcode'], '[contact-form-7 ') !== false) {
            $item['settings']['shortcode'] = preg_replace(
                '/\[contact-form-7\s[^\]]*\]/',
                '[contact-form-7 id="10992"]',
                $item['settings']['shortcode'], -1, $replaced
            );
            $count += $replaced;
        }
        if (!empty($item['elements'])) $repair($item['elements']);
    }
};
$repair($nodes);
if ($count !== 1) WP_CLI::error('Expected exactly one enquiry widget. Nothing changed.');
$backup = '/home/albedode/alb-landed-review-20261106/form-repair-' . gmdate('Ymd-His') . '.json';
if (file_put_contents($backup, $before, LOCK_EX) === false) WP_CLI::error('Backup failed.');
chmod($backup, 0600);
$after = wp_json_encode($nodes);
update_post_meta(10993, '_elementor_data', wp_slash($after));
if (get_post_meta(10993, '_elementor_data', true) !== $after) WP_CLI::error('Draft write verification failed.');
delete_post_meta(10993, '_elementor_element_cache');
if (class_exists('\\Elementor\\Core\\Files\\CSS\\Post')) {
    \Elementor\Core\Files\CSS\Post::create(10993)->delete();
}
WP_CLI::success('Draft 10993 now references copied form 10992. Verify the rendered preview.');
WP_CLI::line('Backup: ' . $backup);
