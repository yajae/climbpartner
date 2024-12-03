import React, { useState } from 'react';

const ArticleSearch = () => {
    const [query, setQuery] = useState('');
    const [articles, setArticles] = useState([]);

    const handleSearch = async () => {
        try {
            const response = await fetch(`/api/articles/search?q=${query}`);
            const data = await response.json();
            setArticles(data);
        } catch (error) {
            console.error('Error fetching articles:', error);
        }
    };

    return (
        <div>
            <h1>搜尋精選文章</h1>
            <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="輸入關鍵字"
            />
            <button onClick={handleSearch}>搜尋</button>
            <ul>
                {articles.map(article => (
                    <li key={article._id}>
                        <h2>{article.title}</h2>
                        <p>{article.content}</p>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default ArticleSearch;
