export interface Profile {
  name: string;
  title: string;
  bio: string;
  photoUrl?: string;
  cvUrl?: string;
}

export interface Skill {
  id: string;
  name: string;
  category: string;
  proficiency: number;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  liveUrl?: string;
  repoUrl?: string;
  tags: string[];
  order: number;
}

export interface Education {
  id: string;
  school: string;
  degree: string;
  period: string;
  description: string;
  order: number;
}

export interface ContactInfo {
  email: string;
  phone?: string;
  location?: string;
  facebook?: string;
  linkedin?: string;
  github?: string;
}

export interface Message {
  id: string;
  name: string;
  email: string;
  content: string;
  createdAt: any;
}
