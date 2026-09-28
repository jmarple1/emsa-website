// Text blocks officers can edit at /admin > Site content. Keep the keys and
// kinds in step with backend/src/utils/ContentBlocks.h.
export type BlockKind = 'text' | 'paragraph' | 'lines' | 'email' | 'url' | 'links' | 'people';

export interface ContentBlock {
  key: string;
  kind: BlockKind;
  label: string;
  page: { name: string; path: string; fragment?: string };
  hint: string;
  example?: string;
}

export const CONTENT_BLOCKS: ContentBlock[] = [
  {
    key: 'next_meeting', kind: 'text', label: 'Next general body meeting',
    page: { name: 'Join', path: '/join', fragment: 'already-a-member' },
    hint: 'Date, time, and place. Also shown in the confirmation after someone fills out the interest form. Update it after every meeting.',
    example: 'Wednesday, October 1, 7:00 PM, Room 101, Upham Hall',
  },
  {
    key: 'officer_roles', kind: 'lines', label: 'Open officer roles',
    page: { name: 'Join', path: '/join' },
    hint: 'One role per line, when elections approach. Leave empty the rest of the year.',
    example: 'Treasurer: tracks supplies and the grant budget',
  },
  {
    key: 'contact_email', kind: 'email', label: 'Contact email',
    page: { name: 'Contact', path: '/contact' },
    hint: "EMSA's entity email address. Never a personal address.",
  },
  {
    key: 'social_links', kind: 'links', label: 'Social media links',
    page: { name: 'Contact', path: '/contact' },
    hint: 'One link per line, written as "Label | https://address". Name each after the platform.',
    example: 'EMSA on Instagram | https://www.instagram.com/...',
  },
  {
    key: 'kit_contents', kind: 'lines', label: "What's in a kit",
    page: { name: 'Naloxone', path: '/naloxone' },
    hint: 'One item per line. Shown under "Each Narcan kit contains Narcan, a naloxone nasal spray."',
  },
  {
    key: 'heart_club', kind: 'paragraph', label: 'Heart Club',
    page: { name: 'What We Do', path: '/what-we-do', fragment: 'outreach' },
    hint: 'What the AHA Heart Club does and who it is for. Leave a blank line between paragraphs.',
  },
  {
    key: 'aed_map_url', kind: 'url', label: 'AED map link',
    page: { name: 'In an Emergency', path: '/emergency' },
    hint: "Web address of Miami's AED locations map, if Miami publishes one. Shown as the link \"Miami's AED locations\".",
  },
  {
    key: 'faq_ohio', kind: 'paragraph', label: 'FAQ: Ohio requirements',
    page: { name: 'FAQ', path: '/faq' },
    hint: 'Answer to "How do you distribute naloxone and test strips in line with Ohio requirements?" Shown after the sentence that is already there.',
  },
  {
    key: 'web_officer', kind: 'text', label: 'Web and social media officer',
    page: { name: 'About', path: '/about' },
    hint: 'The officer role and name that own the website, social media, and the weekly update.',
    example: 'Director of Electronic Systems, Jane Doe',
  },
  {
    key: 'leadership', kind: 'people', label: 'Leadership',
    page: { name: 'About', path: '/about', fragment: 'leadership-title' },
    hint: 'One person per line, written as "Name | Role", in the order to show them. Leave empty to keep the current list (Max Ilecki and Jordan Vandeventer, Co-Presidents; Leslie Haxby-McNeill, Faculty Advisor). Update after elections.',
    example: 'Max Ilecki | Co-President',
  },
];
