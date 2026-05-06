# **FacilPay: Master Design & Interaction Blueprint**

Este documento define la arquitectura visual y el sistema de interacción de la plataforma FacilPay. Su objetivo es servir como guía técnica para desarrolladores e IAs (como Claude Code, Cursor o Copilot) para replicar o extender la experiencia cinemática de la marca.

## **1\. Filosofía de Diseño (The "Apple" Standard)**

El diseño se basa en la **limpieza atmosférica** y el **contraste dramático**.

* **Paleta de Colores:** \* Base: \#000000 (Pure Black).  
  * Accento: \#3B8BFF (Electric Blue).  
  * Secundario: \#06b6d4 (Cyan).  
  * Luz de fondo: Degradados radiales con un blur de 40px a 80px para crear profundidad.  
* **Tipografía:** Inter (Sans Serif). Pesos: 900 (Black) para títulos, 500 para cuerpo, 700 para etiquetas.  
* **Espaciado:** Uso agresivo de aire (whitespace). Ningún elemento debe sentirse apretado.

## **2\. Sistema de Animación y Scroll (Scrubbing logic)**

El motor principal es **GSAP (GreenSock Animation Platform)** junto con **ScrollTrigger**.

### **A. Scroll Inercial (Smooth Scroll)**

Se debe priorizar una sensación de "peso" en el scroll.

* **En Desktop:** Implementar Lenis o GSAP Observer para suavizar el movimiento.  
* **En Mobile:** Mantener scroll nativo pero usar lerp (Linear Interpolation) en los elementos visuales para que no se sientan rígidos.

### **B. El Concepto de "Scrubbing"**

Las animaciones no se disparan por tiempo (Duration), sino por **progreso de scroll**.

* **Regla:** scrub: 1 o scrub: true. Esto vincula la posición del usuario en la página con el frame de la animación. Si el usuario sube, la animación retrocede.

## **3\. Composición de Escenas (Layout Architecture)**

### **Escena 1: El Hero Split**

* **Desktop:** Pantalla dividida 50/50 verticalmente. Izquierda: Texto. Derecha: Producto 3D.  
* **Mobile:** Stack vertical. Arriba: Producto (Fondo negro con Glow). Abajo: Texto (Fondo blanco con tipografía negra). Esto crea un contraste de "interrupción" visual muy fuerte.

### **Escena 2: Mockup 3D (Phone Frame)**

El teléfono no es una imagen plana, es un contenedor CSS 3D:

* **Efecto:** perspective: 1200px.  
* **Movimiento:** Al hacer scroll, el teléfono debe rotar levemente en los ejes Y (rotateY) y X (rotateX).  
* **Atmósfera:** Un elemento div detrás del teléfono con un radial-gradient que cambia su opacidad según el scroll.

### **Escena 3: Cinematic Chat**

* **Mecánica de Pinning:** La sección debe quedar fija (pin: true) mientras el usuario hace scroll.  
* **Secuencia:** 1\. Aparece el título "Charlar" con opacidad baja. 2\. Aparece el mensaje 1 (Slide desde la izquierda). 3\. Aparece el mensaje 2 (Slide desde la derecha \+ color de acento). 4\. El teléfono rota y se aleja (scale down) para simbolizar el envío.

## **4\. Instrucción Maestra para IA (Prompt de Implementación)**

**Objetivo:** Construir una landing page ultra-premium para FacilPay utilizando HTML/CSS/JS (GSAP) o React/Tailwind.  
**Instrucciones Críticas:**

1. **Fidelidad Visual:** El fondo debe ser negro puro. Los elementos interactivos deben tener un brillo (glow) suave color azul \#3B8BFF.  
2. **Animaciones:** Usa GSAP ScrollTrigger para todas las entradas. Nada debe aparecer de forma estática; usa y: 50, opacity: 0 y stagger.  
3. **Responsividad:** \> \- En móviles, asegura que los títulos usen clamp(2rem, 10vw, 5rem) para evitar desbordamientos.  
   * Cambia de layouts de flex-direction: row a column sin perder el balance de blancos/negros.  
4. **Manejo de Imágenes:** No uses assets externos pesados. Genera mockups de teléfonos usando CSS (bordes redondeados, sombras profundas).  
5. **Interacción:** Implementa "Magnetic Buttons" o estados de hover que cambien el color del borde del contenedor principal.

**Lenguajes Sugeridos:**

* **Frontend:** React \+ Tailwind \+ GSAP (Recomendado para escalabilidad).  
* **Low Level:** HTML5 \+ CSS3 (Variables) \+ GSAP (Recomendado para máxima velocidad de carga).

## **5\. Detalles de la Interfaz (UI Specs)**

* **Bordes:** border-radius: 30px para tarjetas, 45px para teléfonos.  
* **Sombras:** box-shadow: 0 40px 100px rgba(0,0,0,0.5).  
* **Glow:** box-shadow: 0 0 50px rgba(59, 139, 255, 0.3).