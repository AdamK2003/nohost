export interface PostWithComments {
  post: Post;
  comments: CommentsObject;
}

export interface PostStub {
  // data used to fetch a post
  handle: string; // project handle
  postId: number; // post id
}

export interface Post {
  postId: number; // unique identifier
  headline: string; // title of the post
  publishedAt: string; // ISO 8601
  filename: string; // `${postId}-${headline.slugify()}`, this would be the canonical URL
  shareOfPostId: number | null; // if this post is a share, this is the original post id
  transparentShareOfPostId: number | null; // I dunno what's the difference between this and shareOfPostId
  state: number; // I have no idea what this is
  numComments: number; // number of comments
  cws: string[]; // content warnings
  tags: string[]; // normal tags
  hasCohostPlus: boolean; // assuming this tells you if the poster has cohost plus or had it at the time of posting
  pinned: boolean; // is the post pinned on the poster's profile
  commentsLocked: boolean; // are comments locked
  sharesLocked: boolean; // are shares locked
  blocks: PostBlock[]; // the content of the post as an array of blocks
  plainTextBody: string; // the content of the post as plain text
  postingProject: Project; // the project that posted this
  shareTree: Post[]; // the share tree of this post
  numSharedComments: number; // number of comments on shared posts (I think)
  relatedProjects: Project[]; // projects related to this post (what does this mean?)
  singlePostPageUrl: string; // url to the post
  effectiveAdultContent: boolean; // is the post marked as adult content (what does effective mean?)
  isEditor: boolean; // can the current project edit this post (I think)
  hasAnyContributorMuted: boolean; // does the post/share tree have any posts muted on the current project(?)
  contributorBlockIncomingOrOutgoing: boolean; // I have no idea what this is
  postEditUrl: string; // url to edit the post
  isLiked: boolean; // is the post liked by the current project
  canShare: boolean; // can the current project share this post
  canPublish: boolean; // can the current project publish this post (what does this mean?)
  limitedVisibilityReason: string; // moderation reason for limited visibility? idk
  astMap: {
    spans: AstMapSpan[];
    readMoreIndex: number | null; // determines the cutoff point for the read more button?
  };
  responseToAskId: number | null; // if this post is a response to an ask, this is the ask id
}

export type PostBlock = MarkdownBlock | AttachmentRowBlock | any; // todo: determine if there are more types

export interface PostBlockBase {
  type: string;
}

export interface MarkdownBlock extends PostBlockBase {
  type: "markdown";
  markdown: {
    content: string;
  };
}

export interface AttachmentRowBlock extends PostBlockBase {
  type: "attachmentRow";
  attachments: PostAttachmentObject[];
}

export interface PostAttachmentObject {
  type: string;
  attachment: Attachment;
}

export interface Attachment {
  attachmentId: string; // uuid
  altText: string; // alt text for the image
  previewUrl: string; // url to the image preview
  fileUrl: string; // url to the full image
  kind: string; // todo: determine all possible values, currently "image"
  width: number; // width of the image
  height: number; // height of the image
}

export interface AstMapSpan {
  startIndex: number;
  endIndex: number;
  ast: string; // json as string, I think this is used by the renderer
}

export enum PrivacyState { // TODO: verify possible values... gonna be hard, considering the site is read-only
  Public = "public",
  Private = "private",
}

export interface Project {
  projectId: number; // unique identifier
  handle: string; // project handle
  displayName: string; // project display name
  dek: string; // project headline
  description: string; // project long description
  avatarURL: string; // url to the project avatar
  avatarPreviewURL: string; // url to the project avatar preview
  headerURL: string; // url to the project header
  headerPreviewURL: string; // url to the project header preview
  privacy: string; // project privacy, idk what exactly this means
  url: string; // user defined url
  pronouns: string; // user defined pronouns
  flags: string[]; // TODO: determine possible values, all empty right now, type is assumed
  avatarShape: string; // TODO: determine possible values, right now we have "squircle", "roundrect"
  loggedOutPostVisibility: string; // post visibility for logged out users, probably PrivacyState, but not sure, all "public" right now
  frequentlyUsedTags: string[]; // frequently used tags by the project
  askSettings: {
    enabled: boolean; // are asks enabled
    allowAnon: boolean; // can anonymous users send asks
    requireLoggedInAnon: boolean; // do you need to be logged in to send anon asks
  };
  contactCard: ContactCardObject[];
  deleteAfter: string | number | null; // no idea, we only have nulls so far
  isSelfProject: any; // no idea, we only have nulls so far
}

export interface ContactCardObject {
  service: string; // service name (key)
  value: string; // value (URL, username, etc, can be anything)
  visibility: string; // TODO: determine possible values, right now we have "public"
}

export interface ProjectPostPage {
  posts: Post[];
  pagination: ProfilePostPagePaginationSettings;
}

export interface ProfilePostPagePaginationSettings {
  previousPage: number;
  nextPage: number;
  currentPage: number;
  morePagesForward: boolean;
}

export interface CommentsObject {
  // dictionary of comments, key is post id the comment is on (for share tree reasons)
  [key: string]: Comment[];
}

export interface Comment {
  comment: CommentContent;
  canInteract: string; // TODO: determine possible values, right now we have "not-allowed", read only mode thing?
  canEdit: string; // same
  canHide: string; // same
  poster: Project; // the project that posted the comment
}

export interface CommentContent {
  commentId: string; // uuid
  postedAtISO: string; // ISO 8601
  deleted: boolean; // is the comment deleted
  body: string; // comment content
  children: Comment[]; // child comments
  postId: number; // post id the comment is on
  inReplyTo: string | null; // uuid of the comment this is a reply to (I assume)
  hasCohostPlus: boolean; // assuming this tells you if the commenter has cohost plus or had it at the time of commenting
  hidden: boolean; // is the comment hidden
}

export interface TagTimelineResponse {
  "tagged-post-feed": TagTimelinePage;
}

export interface TagTimelinePage {
  posts: Post[];
  paginationMode: TagTimelinePaginationMode;
  noPostsStringId: string; // localization string? dunno, example data had `common:no-tagged-posts-placeholder`
  tagName: string; // tag name
  show18PlusPosts: boolean; // self explanatory
  synonymsAndRelatedTags: TagRelationship[]; // array of tag relationships
}

export interface TagRelationship {
  tag_id: string; // target tag ID
  content: string; // target tag name
  relationship: string; // relationship type, only got `synonym` so far
}

export interface TagTimelinePaginationMode {
  mode: string; // refTimestampOffsetLimit in sample data
  currentSkip: number; // current amount of skipped posts
  idealPageStride: number; // ideal offset from currentSkip to fetch the next page
  morePagesForward: boolean; // is there a next page?
  morePagesBackward: boolean; // is there a previous page?
  refTimestamp: number; // reference timestamp for pagination, needs to be passed with
  pageUrlFactoryName: string; // type of the page that generated this, for example `tags`
  tagSlug?: string; // tag name/slug, for example `uxbridge english dictionary`
}

export interface Tag {
  name: string; // tag name
  relationships: TagRelationship[];
}
