// PostCard.jsx - Component for displaying a post in a card format

import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import Button from './Button';
import './PostCard.css';

const PostCard = ({
  post,
  onLike,
  onComment,
  currentUser,
  showActions = true,
}) => {
  const {
    _id,
    title,
    excerpt,
    author,
    category,
    createdAt,
    views,
    likeCount,
    commentCount,
    featuredImage,
    isLiked,
  } = post;

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleLike = () => {
    if (onLike && currentUser) {
      onLike(_id);
    }
  };

  const handleComment = () => {
    if (onComment) {
      onComment(_id);
    }
  };

  return (
    <article className="post-card" data-testid="post-card">
      {featuredImage && (
        <div className="post-card__image">
          <img src={featuredImage} alt={title} />
        </div>
      )}
      
      <div className="post-card__content">
        <header className="post-card__header">
          {category && (
            <span 
              className="post-card__category"
              style={{ backgroundColor: category.color }}
            >
              {category.name}
            </span>
          )}
          
          <h2 className="post-card__title">
            <Link to={`/posts/${_id}`}>{title}</Link>
          </h2>
        </header>

        {excerpt && (
          <p className="post-card__excerpt">{excerpt}</p>
        )}

        <footer className="post-card__footer">
          <div className="post-card__meta">
            <div className="post-card__author">
              {author.avatar && (
                <img 
                  src={author.avatar} 
                  alt={author.username}
                  className="post-card__author-avatar"
                />
              )}
              <span className="post-card__author-name">
                {author.firstName && author.lastName 
                  ? `${author.firstName} ${author.lastName}`
                  : author.username
                }
              </span>
            </div>
            
            <div className="post-card__stats">
              <span className="post-card__date">{formatDate(createdAt)}</span>
              <span className="post-card__views">{views} views</span>
            </div>
          </div>

          {showActions && (
            <div className="post-card__actions">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleLike}
                disabled={!currentUser}
                className={`post-card__like-btn ${isLiked ? 'post-card__like-btn--liked' : ''}`}
                data-testid="like-button"
              >
                ❤️ {likeCount || 0}
              </Button>
              
              <Button
                variant="secondary"
                size="sm"
                onClick={handleComment}
                className="post-card__comment-btn"
                data-testid="comment-button"
              >
                💬 {commentCount || 0}
              </Button>
            </div>
          )}
        </footer>
      </div>
    </article>
  );
};

PostCard.propTypes = {
  post: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    excerpt: PropTypes.string,
    author: PropTypes.shape({
      username: PropTypes.string.isRequired,
      firstName: PropTypes.string,
      lastName: PropTypes.string,
      avatar: PropTypes.string,
    }).isRequired,
    category: PropTypes.shape({
      name: PropTypes.string.isRequired,
      color: PropTypes.string,
    }),
    createdAt: PropTypes.string.isRequired,
    views: PropTypes.number,
    likeCount: PropTypes.number,
    commentCount: PropTypes.number,
    featuredImage: PropTypes.string,
    isLiked: PropTypes.bool,
  }).isRequired,
  onLike: PropTypes.func,
  onComment: PropTypes.func,
  currentUser: PropTypes.object,
  showActions: PropTypes.bool,
};

export default PostCard;
