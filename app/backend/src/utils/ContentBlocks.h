#pragma once
#include <string>
#include <vector>

// Text blocks officers can edit from the dashboard. Each fills a spot that
// was a placeholder on the static site. Values are plain text (never HTML);
// the Angular pages render them as text, lists, or validated links.
//
// Keep in step with CONTENT_BLOCKS in
// frontend/src/app/pages/admin/content-blocks.ts.
namespace ContentBlocks {

enum class Kind {
    Text,       // one line
    Paragraph,  // free text, blank line = new paragraph
    Lines,      // one item per line (rendered as a list)
    Email,      // one email address (rendered as a mailto link)
    Url,        // one https:// address
    Links,      // one "Label | https://..." per line
};

struct Block {
    std::string key;
    Kind kind;
};

inline const std::vector<Block>& all() {
    static const std::vector<Block> blocks = {
        {"next_meeting", Kind::Text},       // Join: already-a-member + confirmation
        {"officer_roles", Kind::Lines},     // Join: open officer roles
        {"contact_email", Kind::Email},     // Contact: entity email
        {"social_links", Kind::Links},      // Contact: social media
        {"kit_contents", Kind::Lines},      // Naloxone: what's in a kit
        {"heart_club", Kind::Paragraph},    // What We Do: Heart Club
        {"aed_map_url", Kind::Url},         // In an Emergency: AED locations
        {"faq_ohio", Kind::Paragraph},      // FAQ: Ohio requirements answer
        {"web_officer", Kind::Text},        // About: web/social/update officer
    };
    return blocks;
}

inline const Block* find(const std::string& key) {
    for (const auto& b : all())
        if (b.key == key) return &b;
    return nullptr;
}

} // namespace ContentBlocks
