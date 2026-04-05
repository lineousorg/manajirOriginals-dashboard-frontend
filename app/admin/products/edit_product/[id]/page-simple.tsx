"use client";
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Plus, Trash2, ArrowLeft, Loader2, Save } from "lucide-react";
import { PageTransition, FadeIn } from "@/components/ui/motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useParams, useRouter } from "next/navigation";
import { productsApi } from "@/services/api";
import { Category } from "@/types/category";
import { Product } from "@/types/product";

interface VariantAttribute {
  attributeId: number;
  valueId: number;
  attributeValue?: {
    id: number;
    value: string;
    attribute?: { id: number; name: string };
  };
}

interface ProductVariant {
  id?: number;
  sku: string;
  price: number;
  stock: number;
  isActive: boolean;
  attributes: VariantAttribute[];
}

interface ProductImage {
  url: string;
  altText: string;
  position: number;
}

const EditProductSimplePage = () => {
  const params = useParams<{ id: string }>();
  const id = Number(params?.id);
  const router = useRouter();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [product, setProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [attributeValues, setAttributeValues] = useState<any[]>([]);
  const [attributes, setAttributes] = useState<any[]>([]);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    categoryId: 0,
    variants: [] as ProductVariant[],
    images: [] as ProductImage[],
  });

  // Fetch product and supporting data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productData, categoriesData, productsData] = await Promise.all([
          productsApi.getById(id),
          productsApi.getAll(),
          // Get categories from the product
        ]);

        // Get all attribute values
        const allAttributeValues: any[] = [];
        productsData.forEach((p: Product) => {
          p.variants.forEach((v) => {
            v.attributes.forEach((attr: any) => {
              if (attr.attributeValue && !allAttributeValues.find(av => av.id === attr.attributeValue.id)) {
                allAttributeValues.push(attr.attributeValue);
              }
            });
          });
        });
        
        // Also fetch attribute values from API if available
        // For now, extract from products
        setAttributeValues(allAttributeValues);

        // Get unique attributes
        const uniqueAttrs: any[] = [];
        allAttributeValues.forEach((av) => {
          if (av.attribute && !uniqueAttrs.find(a => a.id === av.attribute.id)) {
            uniqueAttrs.push(av.attribute);
          }
        });
        setAttributes(uniqueAttrs);

        // Transform product data
        const transformedVariants = productData.variants.map((v: any) => ({
          id: v.id,
          sku: v.sku,
          price: typeof v.price === 'string' ? parseFloat(v.price) : v.price,
          stock: v.stock,
          isActive: v.isActive,
          attributes: v.attributes || [],
        }));

        setProduct(productData);
        setFormData({
          name: productData.name,
          description: productData.description,
          categoryId: productData.categoryId,
          variants: transformedVariants,
          images: productData.images || [],
        });

        // Get categories
        // Need to fetch categories separately - use a placeholder for now
        setCategories([]);

      } catch (error) {
        console.error("Error fetching product:", error);
        toast({
          title: "Error",
          description: "Failed to load product",
          variant: "destructive",
        });
        router.push("/admin/products");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id, router, toast]);

  // Update variant field
  const updateVariant = (index: number, field: string, value: any) => {
    const newVariants = [...formData.variants];
    (newVariants[index] as any)[field] = value;
    setFormData({ ...formData, variants: newVariants });
  };

  // Update variant attribute
  const updateVariantAttribute = (variantIndex: number, attrId: number, valueId: number) => {
    const newVariants = [...formData.variants];
    const variant = newVariants[variantIndex];
    
    // Remove existing attribute of this type
    const filteredAttrs = variant.attributes.filter((a: any) => 
      a.attributeValue?.attribute?.id !== attrId && a.attributeId !== attrId
    );
    
    // Add new attribute
    filteredAttrs.push({
      attributeId: attrId,
      valueId: valueId,
    });
    
    variant.attributes = filteredAttrs;
    setFormData({ ...formData, variants: newVariants });
  };

  // Get current attribute value for a variant
  const getCurrentAttributeValue = (variant: ProductVariant, attrId: number) => {
    const attr = variant.attributes.find((a: any) => 
      a.attributeValue?.attribute?.id === attrId || a.attributeId === attrId
    );
    if (attr) {
      return attr.attributeValue?.id || attr.valueId;
    }
    return "";
  };

  // Save product
  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast({ title: "Error", description: "Product name is required", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    try {
      await productsApi.update(id, {
        name: formData.name,
        description: formData.description,
        categoryId: formData.categoryId,
        variants: formData.variants.map(v => ({
          sku: v.sku,
          price: v.price,
          stock: v.stock,
          attributes: v.attributes,
        })),
        images: formData.images,
      });

      toast({ title: "Success", description: "Product updated successfully" });
      router.push("/admin/products");
    } catch (error) {
      console.error("Error updating product:", error);
      toast({ title: "Error", description: "Failed to update product", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <PageTransition>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </PageTransition>
    );
  }

  if (!product) {
    return (
      <PageTransition>
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <h2 className="text-xl font-semibold mb-2">Product not found</h2>
          <Button onClick={() => router.push("/admin/products")}>Back to Products</Button>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push("/admin/products")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Edit Product</h1>
              <p className="text-muted-foreground">{product.name}</p>
            </div>
          </div>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Save Changes
          </Button>
        </div>

        {/* Basic Info */}
        <div className="bg-card rounded-lg border p-6 space-y-4">
          <h2 className="text-lg font-semibold">Basic Information</h2>
          
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Product Name</Label>
              <Input 
                value={formData.name} 
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select 
                value={String(formData.categoryId)} 
                onValueChange={(val) => setFormData({ ...formData, categoryId: Number(val) })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={String(cat.id)}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2 space-y-2">
              <Label>Description</Label>
              <Textarea 
                value={formData.description} 
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
              />
            </div>
          </div>
        </div>

        {/* Variants */}
        <div className="bg-card rounded-lg border p-6 space-y-4">
          <h2 className="text-lg font-semibold">Product Variants</h2>
          
          <div className="space-y-4">
            {formData.variants.map((variant, index) => (
              <div key={index} className="p-4 bg-muted/50 rounded-lg space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Label>Active</Label>
                    <Switch 
                      checked={variant.isActive}
                      onCheckedChange={(checked) => updateVariant(index, 'isActive', checked)}
                    />
                  </div>
                  <div className="flex-1">
                    <Input 
                      placeholder="SKU" 
                      value={variant.sku}
                      onChange={(e) => updateVariant(index, 'sku', e.target.value)}
                    />
                  </div>
                  <div className="w-24">
                    <Input 
                      type="number"
                      placeholder="Price" 
                      value={variant.price}
                      onChange={(e) => updateVariant(index, 'price', Number(e.target.value))}
                    />
                  </div>
                  <div className="w-24">
                    <Input 
                      type="number"
                      placeholder="Stock" 
                      value={variant.stock}
                      onChange={(e) => updateVariant(index, 'stock', Number(e.target.value))}
                    />
                  </div>
                </div>

                {/* Attributes */}
                {attributeValues.length > 0 && (
                  <div className="grid gap-4 md:grid-cols-2">
                    {attributes.map((attr) => {
                      const currentValue = getCurrentAttributeValue(variant, attr.id);
                      const attrValues = attributeValues.filter(av => av.attribute?.id === attr.id);
                      
                      return (
                        <div key={attr.id} className="space-y-2">
                          <Label>{attr.name}</Label>
                          <Select 
                            value={String(currentValue)} 
                            onValueChange={(val) => updateVariantAttribute(index, attr.id, Number(val))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder={`Select ${attr.name}`} />
                            </SelectTrigger>
                            <SelectContent>
                              {attrValues.map((av) => (
                                <SelectItem key={av.id} value={String(av.id)}>
                                  {av.value}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </PageTransition>
  );
};

export default EditProductSimplePage;