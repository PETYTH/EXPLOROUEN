
CREATE TABLE images (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
    filename TEXT NOT NULL,
    originalName TEXT NOT NULL,
    mimeType TEXT NOT NULL,
    size INTEGER NOT NULL,
    data TEXT NOT NULL,
    entityType TEXT NOT NULL,
    entityId TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE places (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    address TEXT NOT NULL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    category TEXT NOT NULL,
    images TEXT,
    audioGuide TEXT,
    isActive BOOLEAN DEFAULT 1,
    openingHours TEXT,
    historicalPeriod TEXT,
    accessibility TEXT,
    website TEXT,
    phone TEXT,
    email TEXT,
    entryPrice REAL,
    estimatedDuration INTEGER,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE activities (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    type TEXT NOT NULL,
    difficulty TEXT NOT NULL,
    duration INTEGER NOT NULL,
    distance REAL,
    maxParticipants INTEGER NOT NULL,
    startDate DATETIME NOT NULL,
    endDate DATETIME,
    meetingPoint TEXT NOT NULL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    isActive BOOLEAN DEFAULT 1,
    price REAL,
    equipment TEXT,
    level TEXT,
    createdBy TEXT NOT NULL,
    image TEXT,
    category TEXT,
    organizerName TEXT,
    organizerAvatar TEXT,
    organizerRating REAL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE activity_places (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
    activityId TEXT NOT NULL,
    placeId TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    description TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (activityId) REFERENCES activities(id) ON DELETE CASCADE,
    FOREIGN KEY (placeId) REFERENCES places(id) ON DELETE CASCADE,
    UNIQUE(activityId, placeId)
);

CREATE TABLE monuments (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    image TEXT NOT NULL,
    rating REAL NOT NULL,
    visitDuration TEXT NOT NULL,
    category TEXT NOT NULL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    address TEXT NOT NULL,
    openingHours TEXT NOT NULL,
    price TEXT NOT NULL,
    highlights TEXT NOT NULL,
    history TEXT NOT NULL,
    easterEggHints TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE treasure_hunts (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    period TEXT NOT NULL,
    startDate DATETIME NOT NULL,
    endDate DATETIME NOT NULL,
    difficulty TEXT NOT NULL,
    prize TEXT,
    prizeValue REAL,
    isActive BOOLEAN DEFAULT 1,
    maxParticipants INTEGER,
    rules TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);



CREATE TABLE treasure_hunt_places (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
    treasureHuntId TEXT NOT NULL,
    placeId TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    clue TEXT NOT NULL,
    solution TEXT,
    points INTEGER DEFAULT 10,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (treasureHuntId) REFERENCES treasure_hunts(id) ON DELETE CASCADE,
    FOREIGN KEY (placeId) REFERENCES places(id) ON DELETE CASCADE,
    UNIQUE(treasureHuntId, placeId)
);


CREATE TABLE registrations (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
    userId TEXT NOT NULL,
    type TEXT NOT NULL,
    itemId TEXT NOT NULL,
    status TEXT DEFAULT 'PENDING',
    score INTEGER,
    completedAt DATETIME,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(userId, itemId, type)
);


    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
    activityId TEXT UNIQUE,
    title TEXT NOT NULL,
    isActive BOOLEAN DEFAULT 1,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (activityId) REFERENCES activities(id) ON DELETE CASCADE
);

CREATE TABLE discussion_messages (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
    discussionId TEXT NOT NULL,
    userId TEXT NOT NULL,
    content TEXT NOT NULL,
    messageType TEXT DEFAULT 'TEXT',
    mediaUrl TEXT,
    thumbnailUrl TEXT,
    attachments TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (discussionId) REFERENCES discussions(id) ON DELETE CASCADE
);


CREATE TABLE reviews (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
    userId TEXT NOT NULL,
    placeId TEXT NOT NULL,
    rating INTEGER NOT NULL,
    comment TEXT,
    images TEXT,
    helpfulCount INTEGER DEFAULT 0,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (placeId) REFERENCES places(id) ON DELETE CASCADE,
    UNIQUE(userId, placeId)
);


CREATE TABLE favorite_places (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
    userId TEXT NOT NULL,
    placeId TEXT NOT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (placeId) REFERENCES places(id) ON DELETE CASCADE,
    UNIQUE(userId, placeId)
);


CREATE TABLE chat_participants (
    id TEXT PRIMARY KEY,
    chatId TEXT NOT NULL,
    userId TEXT NOT NULL,
    joinedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    leftAt DATETIME,
    FOREIGN KEY (chatId) REFERENCES chats(id) ON DELETE CASCADE,
    UNIQUE(chatId, userId)
);


CREATE TABLE chats (
    id TEXT PRIMARY KEY,
    activityId TEXT,
    type TEXT DEFAULT 'GROUP',
    name TEXT,
    isActive BOOLEAN DEFAULT 1,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL
);


CREATE TABLE messages (
    id TEXT PRIMARY KEY,
    chatId TEXT NOT NULL,
    userId TEXT NOT NULL,
    content TEXT NOT NULL,
    messageType TEXT DEFAULT 'TEXT',
    mediaUrl TEXT,
    isRead BOOLEAN DEFAULT 0,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL,
    FOREIGN KEY (chatId) REFERENCES chats(id) ON DELETE CASCADE
);


CREATE TABLE notifications (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    data TEXT,
    isRead BOOLEAN DEFAULT 0,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL
);



CREATE INDEX idx_places_location ON places(latitude, longitude);
CREATE INDEX idx_activities_location ON activities(latitude, longitude);


CREATE INDEX idx_places_category ON places(category);
CREATE INDEX idx_activities_type ON activities(type);
CREATE INDEX idx_monuments_category ON monuments(category);

CREATE INDEX idx_activities_dates ON activities(startDate, endDate);
CREATE INDEX idx_activities_active ON activities(isActive, startDate);


CREATE INDEX idx_registrations_user ON registrations(userId, type);
CREATE INDEX idx_favorite_places_user ON favorite_places(userId);
CREATE INDEX idx_reviews_user ON reviews(userId);
CREATE INDEX idx_reviews_place ON reviews(placeId);


CREATE INDEX idx_messages_chat ON messages(chatId, createdAt);
CREATE INDEX idx_discussion_messages_discussion ON discussion_messages(discussionId, createdAt);
CREATE INDEX idx_chat_participants_chat ON chat_participants(chatId);
CREATE INDEX idx_notifications_user ON notifications(userId, isRead, createdAt);


CREATE TRIGGER update_images_timestamp 
    AFTER UPDATE ON images
    BEGIN
        UPDATE images SET updatedAt = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;


CREATE TRIGGER update_places_timestamp 
    AFTER UPDATE ON places
    BEGIN
        UPDATE places SET updatedAt = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;


CREATE TRIGGER update_activities_timestamp 
    AFTER UPDATE ON activities
    BEGIN
        UPDATE activities SET updatedAt = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;


CREATE TRIGGER update_monuments_timestamp 
    AFTER UPDATE ON monuments
    BEGIN
        UPDATE monuments SET updatedAt = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

CREATE TRIGGER update_registrations_timestamp 
    AFTER UPDATE ON registrations
    BEGIN
        UPDATE registrations SET updatedAt = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;


CREATE VIEW activities_with_places AS
SELECT 
    a.*,
    GROUP_CONCAT(p.name, ', ') as place_names,
    COUNT(ap.placeId) as places_count
FROM activities a
LEFT JOIN activity_places ap ON a.id = ap.activityId
LEFT JOIN places p ON ap.placeId = p.id
WHERE a.isActive = 1
GROUP BY a.id;


CREATE VIEW places_stats AS
SELECT 
    p.*,
    COUNT(DISTINCT r.id) as reviews_count,
    AVG(r.rating) as average_rating,
    COUNT(DISTINCT fp.userId) as favorites_count
FROM places p
LEFT JOIN reviews r ON p.id = r.placeId
LEFT JOIN favorite_places fp ON p.id = fp.placeId
WHERE p.isActive = 1
GROUP BY p.id;


CREATE VIEW popular_activities AS
SELECT 
    a.*,
    COUNT(reg.id) as participants_count,
    (COUNT(reg.id) * 100.0 / a.maxParticipants) as fill_percentage
FROM activities a
LEFT JOIN registrations reg ON a.id = reg.itemId AND reg.type = 'ACTIVITY' AND reg.status = 'CONFIRMED'
WHERE a.isActive = 1 AND a.startDate > datetime('now')
GROUP BY a.id
ORDER BY participants_count DESC;
