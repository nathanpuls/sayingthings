export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            profiles: {
                Row: {
                    id: string
                    username: string
                    full_name: string | null
                    avatar_url: string | null
                    bio: string | null
                    website: string | null
                    location: string | null
                    role: string | null
                    skills: string[] | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id: string
                    username: string
                    full_name?: string | null
                    avatar_url?: string | null
                    bio?: string | null
                    website?: string | null
                    location?: string | null
                    role?: string | null
                    skills?: string[] | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    username?: string
                    full_name?: string | null
                    avatar_url?: string | null
                    bio?: string | null
                    website?: string | null
                    location?: string | null
                    role?: string | null
                    skills?: string[] | null
                    created_at?: string
                    updated_at?: string
                }
            }
            projects: {
                Row: {
                    id: string
                    user_id: string
                    title: string
                    description: string | null
                    category: string | null
                    image_url: string | null
                    link_url: string | null
                    github_repo_id?: number | null
                    stargazers_count?: number
                    language?: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    title: string
                    description?: string | null
                    category?: string | null
                    image_url?: string | null
                    link_url?: string | null
                    github_repo_id?: number | null
                    stargazers_count?: number
                    language?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    title?: string
                    description?: string | null
                    category?: string | null
                    image_url?: string | null
                    link_url?: string | null
                    github_repo_id?: number | null
                    stargazers_count?: number
                    language?: string | null
                    created_at?: string
                }
            }
        }
    }
}
