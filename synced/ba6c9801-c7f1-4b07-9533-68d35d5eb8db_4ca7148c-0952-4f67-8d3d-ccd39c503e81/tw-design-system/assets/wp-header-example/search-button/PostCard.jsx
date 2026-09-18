/**
 * Card individual de un post en los resultados
 */
const PostCard = ({ post }) => {
  const featuredImage = post._embedded?.['wp:featuredmedia']?.[0]?.source_url;
  const excerpt = post.excerpt.rendered
    .replace(/<[^>]*>/g, '')
    .substring(0, 150);

  return (
    <a
      href={post.link}
      className="flex gap-4 p-4 rounded-lg hover:bg-tertiary-lt/50 transition-colors group mb-0"
    >
      {/* Imagen destacada */}
      {featuredImage && (
        <div className="flex-shrink-0 w-px-120 h-px-93 rounded-lg overflow-hidden bg-outline">
          <img
            src={featuredImage}
            alt={post.title.rendered}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      )}

      {/* Contenido del post */}
      <div className="flex-container justify-center">
        <h3 className="text-large text-left text-primary mb-2 group-hover:text-primary-dk transition-colors line-clamp-1">
          {post.title.rendered}
        </h3>
        <p className="text-small font-semibold text-tertiary-dk line-clamp-2 mb-0">
          {excerpt}...
        </p>
      </div>
    </a>
  );
};

export default PostCard;
