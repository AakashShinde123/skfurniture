"use client";

import { useState } from "react";
import { Loader2, Plus, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { ImageUploader, type GalleryImage } from "./image-uploader";
import { ApiClientError } from "@/lib/client/api";
import { useSiteSettings, useUpdateSettings } from "@/hooks/admin/use-settings";
import type { HeroStat, SiteSettingsDto, SocialLinks, Testimonial } from "@/types";

/**
 * Site settings form (PRD §5 "Website settings") — shop identity, contact &
 * WhatsApp number, homepage hero, about/showroom, socials, testimonials and
 * default SEO. All fields save in one PUT.
 */
export function SettingsForm() {
  const { data: settings, isPending } = useSiteSettings();

  if (isPending || !settings) {
    return <div className="h-96 animate-pulse rounded-xl bg-muted" />;
  }

  // Keyed by updatedAt: when a save refreshes the query, the form remounts
  // with the fresh server state (no setState-in-effect sync needed).
  return <SettingsFormInner key={settings.updatedAt} initial={settings} />;
}

function SettingsFormInner({ initial }: { initial: SiteSettingsDto }) {
  const updateMutation = useUpdateSettings();

  // Local editable copy of the settings document.
  const [form, setForm] = useState<SiteSettingsDto>(initial);
  const [heroImages, setHeroImages] = useState<GalleryImage[]>(
    initial.heroImageUrl ? [{ imageKey: initial.heroImageUrl, altText: "", isPrimary: true }] : [],
  );
  const [showroomImages, setShowroomImages] = useState<GalleryImage[]>(
    initial.showroomImages.map((key) => ({ imageKey: key, altText: "", isPrimary: false })),
  );
  const [logoImages, setLogoImages] = useState<GalleryImage[]>(
    initial.logoUrl ? [{ imageKey: initial.logoUrl, altText: "", isPrimary: true }] : [],
  );

  const set = <K extends keyof SiteSettingsDto>(key: K, value: SiteSettingsDto[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  const setSocial = (key: keyof SocialLinks, value: string) =>
    setForm((current) => ({ ...current, socialLinks: { ...current.socialLinks, [key]: value } }));

  const setStat = (index: number, patch: Partial<HeroStat>) =>
    setForm((current) => ({
      ...current,
      heroStats: current.heroStats.map((stat, i) => (i === index ? { ...stat, ...patch } : stat)),
    }));

  const addStat = () =>
    setForm((current) =>
      current.heroStats.length >= 4
        ? current
        : { ...current, heroStats: [...current.heroStats, { value: "", label: "" }] },
    );

  const removeStat = (index: number) =>
    setForm((current) => ({ ...current, heroStats: current.heroStats.filter((_, i) => i !== index) }));

  const submit = async () => {
    const digits = form.whatsappNumber.replace(/\D/g, "");
    if (digits.length < 10 || digits.length > 15) {
      toast.error("WhatsApp number must be 10–15 digits with country code (e.g. 919876543210).");
      return;
    }

    if (form.heroStats.some((stat) => !stat.value.trim() || !stat.label.trim())) {
      toast.error("Every hero stat needs a number and a label — or remove the empty row.");
      return;
    }

    try {
      await updateMutation.mutateAsync({
        shopName: form.shopName,
        tagline: form.tagline,
        logoUrl: logoImages[0]?.imageKey ?? null,
        whatsappNumber: digits,
        phone: form.phone,
        email: form.email,
        address: form.address,
        mapLink: form.mapLink,
        businessHours: form.businessHours,
        serviceAreas: form.serviceAreas,
        announcementText: form.announcementText || null,
        heroHeadline: form.heroHeadline,
        heroSubtitle: form.heroSubtitle,
        heroImageUrl: heroImages[0]?.imageKey ?? null,
        heroCtaText: form.heroCtaText,
        heroCtaLink: form.heroCtaLink,
        heroStats: form.heroStats,
        aboutTitle: form.aboutTitle,
        aboutStory: form.aboutStory,
        showroomImages: showroomImages.map((image) => image.imageKey),
        socialLinks: form.socialLinks,
        testimonialsEnabled: form.testimonialsEnabled,
        testimonials: form.testimonials,
        defaultSeoTitle: form.defaultSeoTitle,
        defaultSeoDescription: form.defaultSeoDescription,
      });
    } catch (error) {
      if (error instanceof ApiClientError) {
        const issue = error.fieldIssues?.[0];
        toast.error(issue ? `${issue.path}: ${issue.message}` : error.message);
      } else {
        toast.error("Could not save settings. Please try again.");
      }
    }
  };

  return (
    <div className="space-y-6 pb-16">
      <Tabs defaultValue="general">
        <TabsList className="flex-wrap">
          <TabsTrigger value="general">Shop & Contact</TabsTrigger>
          <TabsTrigger value="homepage">Homepage Hero</TabsTrigger>
          <TabsTrigger value="about">About & Showroom</TabsTrigger>
          <TabsTrigger value="social">Social & Reviews</TabsTrigger>
          <TabsTrigger value="seo">SEO</TabsTrigger>
        </TabsList>

        {/* ---------------- General ---------------- */}
        <TabsContent value="general" className="mt-4 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Shop identity</CardTitle>
              <CardDescription>Appears in the header, footer and browser tab.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="shopName">Shop name</Label>
                  <Input id="shopName" value={form.shopName} onChange={(event) => set("shopName", event.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="tagline">Tagline</Label>
                  <Input id="tagline" value={form.tagline} onChange={(event) => set("tagline", event.target.value)} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Logo (optional)</Label>
                <ImageUploader value={logoImages} onChange={(next) => setLogoImages(next.slice(-1))} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="announcementText">Announcement bar (leave empty to hide)</Label>
                <Input
                  id="announcementText"
                  value={form.announcementText ?? ""}
                  onChange={(event) => set("announcementText", event.target.value)}
                  placeholder="e.g. Monsoon offer: flat 10% off on dining sets"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contact details</CardTitle>
              <CardDescription>
                The WhatsApp number powers every “Enquire on WhatsApp” button on the website.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="whatsappNumber">WhatsApp number *</Label>
                  <Input
                    id="whatsappNumber"
                    value={form.whatsappNumber}
                    onChange={(event) => set("whatsappNumber", event.target.value)}
                    placeholder="919876543210"
                    className="font-mono"
                  />
                  <p className="text-xs text-muted-foreground">Digits only, with country code. Customer messages open a draft to this number.</p>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" value={form.phone} onChange={(event) => set("phone", event.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={form.email} onChange={(event) => set("email", event.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="serviceAreas">Service / delivery areas</Label>
                  <Input id="serviceAreas" value={form.serviceAreas} onChange={(event) => set("serviceAreas", event.target.value)} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="address">Address</Label>
                <Textarea id="address" rows={2} value={form.address} onChange={(event) => set("address", event.target.value)} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="mapLink">Google Maps link</Label>
                  <Input id="mapLink" value={form.mapLink} onChange={(event) => set("mapLink", event.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="businessHours">Opening hours (one line per entry)</Label>
                  <Textarea
                    id="businessHours"
                    rows={2}
                    value={form.businessHours}
                    onChange={(event) => set("businessHours", event.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ---------------- Homepage hero ---------------- */}
        <TabsContent value="homepage" className="mt-4 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Hero banner</CardTitle>
              <CardDescription>The first thing visitors see. Use a wide photo (1920×1080 recommended).</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="heroHeadline">Headline</Label>
                  <Input id="heroHeadline" value={form.heroHeadline} onChange={(event) => set("heroHeadline", event.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="heroCtaText">Button text</Label>
                  <Input id="heroCtaText" value={form.heroCtaText} onChange={(event) => set("heroCtaText", event.target.value)} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="heroSubtitle">Supporting text</Label>
                <Textarea id="heroSubtitle" rows={2} value={form.heroSubtitle} onChange={(event) => set("heroSubtitle", event.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="heroCtaLink">Button link</Label>
                <Input id="heroCtaLink" value={form.heroCtaLink} onChange={(event) => set("heroCtaLink", event.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Hero image</Label>
                <ImageUploader value={heroImages} onChange={(next) => setHeroImages(next.slice(-1))} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Hero stats strip</CardTitle>
              <CardDescription>
                The numbers shown under the hero content (up to 4). Remove all rows to hide the strip.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {form.heroStats.map((stat, index) => (
                <div key={index} className="flex items-end gap-2">
                  <div className="w-28 space-y-1.5 shrink-0">
                    <Label htmlFor={`heroStatValue-${index}`} className="text-xs text-muted-foreground">
                      Number
                    </Label>
                    <Input
                      id={`heroStatValue-${index}`}
                      value={stat.value}
                      onChange={(event) => setStat(index, { value: event.target.value })}
                      placeholder="27+"
                      aria-label={`Stat ${index + 1} value`}
                    />
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <Label htmlFor={`heroStatLabel-${index}`} className="text-xs text-muted-foreground">
                      Label
                    </Label>
                    <Input
                      id={`heroStatLabel-${index}`}
                      value={stat.label}
                      onChange={(event) => setStat(index, { label: event.target.value })}
                      placeholder="Years of craftsmanship"
                      aria-label={`Stat ${index + 1} label`}
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="mb-0.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => removeStat(index)}
                    aria-label={`Remove stat ${index + 1}`}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden />
                  </Button>
                </div>
              ))}

              {form.heroStats.length < 4 ? (
                <Button variant="outline" size="sm" className="gap-2" onClick={addStat} type="button">
                  <Plus className="h-4 w-4" aria-hidden /> Add stat
                </Button>
              ) : (
                <p className="text-xs text-muted-foreground">Maximum of 4 stats reached.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ---------------- About & showroom ---------------- */}
        <TabsContent value="about" className="mt-4 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>About page</CardTitle>
              <CardDescription>Your shop story. Separate paragraphs with an empty line.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="aboutTitle">Page title</Label>
                <Input id="aboutTitle" value={form.aboutTitle} onChange={(event) => set("aboutTitle", event.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="aboutStory">Story</Label>
                <Textarea id="aboutStory" rows={8} value={form.aboutStory} onChange={(event) => set("aboutStory", event.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Showroom photos (up to 10)</Label>
                <ImageUploader value={showroomImages} onChange={setShowroomImages} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ---------------- Social & reviews ---------------- */}
        <TabsContent value="social" className="mt-4 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Social links</CardTitle>
              <CardDescription>Empty fields are hidden from the footer.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="instagram">Instagram URL</Label>
                <Input id="instagram" value={form.socialLinks.instagram ?? ""} onChange={(event) => setSocial("instagram", event.target.value)} placeholder="https://instagram.com/…" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="facebook">Facebook URL</Label>
                <Input id="facebook" value={form.socialLinks.facebook ?? ""} onChange={(event) => setSocial("facebook", event.target.value)} placeholder="https://facebook.com/…" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="youtube">YouTube URL</Label>
                <Input id="youtube" value={form.socialLinks.youtube ?? ""} onChange={(event) => setSocial("youtube", event.target.value)} placeholder="https://youtube.com/…" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Customer testimonials</CardTitle>
              <CardDescription>
                Only show genuine reviews you have permission to publish — they appear on the homepage.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="testimonialsEnabled" className="cursor-pointer">Show testimonials on the homepage</Label>
                <Switch
                  id="testimonialsEnabled"
                  checked={form.testimonialsEnabled}
                  onCheckedChange={(checked) => set("testimonialsEnabled", checked)}
                />
              </div>

              {form.testimonials.map((testimonial, index) => (
                <div key={index} className="space-y-3 rounded-xl border border-border p-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Input
                      value={testimonial.name}
                      onChange={(event) =>
                        set("testimonials", form.testimonials.map((entry, i) => (i === index ? { ...entry, name: event.target.value } : entry)))
                      }
                      placeholder="Customer name"
                      aria-label={`Testimonial ${index + 1} name`}
                    />
                    <Input
                      value={testimonial.area}
                      onChange={(event) =>
                        set("testimonials", form.testimonials.map((entry, i) => (i === index ? { ...entry, area: event.target.value } : entry)))
                      }
                      placeholder="Area (e.g. Powai, Mumbai)"
                      aria-label={`Testimonial ${index + 1} area`}
                    />
                  </div>
                  <Textarea
                    rows={2}
                    value={testimonial.text}
                    onChange={(event) =>
                      set("testimonials", form.testimonials.map((entry, i) => (i === index ? { ...entry, text: event.target.value } : entry)))
                    }
                    placeholder="What did they say?"
                    aria-label={`Testimonial ${index + 1} text`}
                  />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Label className="text-xs">Stars:</Label>
                      <select
                        value={testimonial.rating}
                        onChange={(event) =>
                          set("testimonials", form.testimonials.map((entry, i) => (i === index ? { ...entry, rating: Number(event.target.value) } : entry)))
                        }
                        className="rounded-md border border-border bg-card px-2 py-1 text-sm"
                        aria-label={`Testimonial ${index + 1} rating`}
                      >
                        {[5, 4, 3, 2, 1].map((rating) => (
                          <option key={rating} value={rating}>{rating}</option>
                        ))}
                      </select>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => set("testimonials", form.testimonials.filter((_, i) => i !== index))}
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden /> Remove
                    </Button>
                  </div>
                </div>
              ))}

              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() =>
                  set("testimonials", [
                    ...form.testimonials,
                    { name: "", area: "", text: "", rating: 5 } satisfies Testimonial,
                  ])
                }
              >
                <Plus className="h-4 w-4" aria-hidden /> Add testimonial
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ---------------- SEO ---------------- */}
        <TabsContent value="seo" className="mt-4 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Default SEO metadata</CardTitle>
              <CardDescription>
                Used on the homepage and as a fallback when a product has no custom SEO fields.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="defaultSeoTitle">Default title</Label>
                <Input id="defaultSeoTitle" value={form.defaultSeoTitle} onChange={(event) => set("defaultSeoTitle", event.target.value)} />
                <p className="text-xs text-muted-foreground">{form.defaultSeoTitle.length}/60 characters — keep titles under 60 for Google.</p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="defaultSeoDescription">Default meta description</Label>
                <Textarea
                  id="defaultSeoDescription"
                  rows={3}
                  value={form.defaultSeoDescription}
                  onChange={(event) => set("defaultSeoDescription", event.target.value)}
                />
                <p className="text-xs text-muted-foreground">{form.defaultSeoDescription.length}/160 characters.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Save bar */}
      <div className="sticky bottom-4 flex justify-end">
        <Button onClick={() => void submit()} disabled={updateMutation.isPending} size="lg" className="gap-2 shadow-lg">
          {updateMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <Save className="h-4 w-4" aria-hidden />
          )}
          Save settings
        </Button>
      </div>
    </div>
  );
}
