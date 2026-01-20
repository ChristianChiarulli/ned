'use client';

import { useState, useEffect } from 'react';
import { FileTextIcon, FileEditIcon, ServerIcon, PlusIcon, SunIcon, MoonIcon, GlobeIcon } from 'lucide-react';
import { useTheme } from 'next-themes';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarHeader,
  SidebarFooter,
  SidebarSeparator,
} from '@/components/ui/sidebar';

interface AppSidebarProps {
  activePanel: string | null;
  onPanelChange: (panel: string | null) => void;
  onNewArticle?: () => void;
}

export default function AppSidebar({ activePanel, onPanelChange, onNewArticle }: AppSidebarProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleClick = (panel: string) => {
    onPanelChange(activePanel === panel ? null : panel);
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-zinc-200 dark:border-zinc-800">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="New Article" onClick={onNewArticle}>
              <PlusIcon />
              <span>New Article</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarSeparator className="mx-0 w-full" />
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  tooltip="Explore"
                  isActive={activePanel === 'explore'}
                  onClick={() => handleClick('explore')}
                >
                  <GlobeIcon />
                  <span>Explore</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  tooltip="My Blogs"
                  isActive={activePanel === 'blogs'}
                  onClick={() => handleClick('blogs')}
                >
                  <FileTextIcon />
                  <span>My Blogs</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  tooltip="Drafts"
                  isActive={activePanel === 'drafts'}
                  onClick={() => handleClick('drafts')}
                >
                  <FileEditIcon />
                  <span>Drafts</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  tooltip="Relays"
                  isActive={activePanel === 'relays'}
                  onClick={() => handleClick('relays')}
                >
                  <ServerIcon />
                  <span>Relays</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip={mounted ? (theme === 'dark' ? 'Light mode' : 'Dark mode') : 'Toggle theme'}
              onClick={toggleTheme}
            >
              {mounted ? (theme === 'dark' ? <SunIcon /> : <MoonIcon />) : <MoonIcon />}
              <span>{mounted ? (theme === 'dark' ? 'Light mode' : 'Dark mode') : 'Toggle theme'}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
